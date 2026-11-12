import hashlib
import json
from pathlib import Path
from time import perf_counter

import numpy as np
from scipy.sparse import hstack
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction import DictVectorizer
from sklearn.feature_extraction.text import TfidfTransformer, TfidfVectorizer
from sklearn.preprocessing import normalize


DATA = Path(__file__).resolve().parents[1] / "src/components/recipatico/data"


def main():
    # Ignore a trailing newline or BOM so Windows checkouts hash identically.
    catalog_text = (DATA / "recipe-catalog.json").read_text(encoding="utf-8-sig").strip()
    recipes = json.loads(catalog_text)
    titles = [r["title"] for r in recipes]
    if len({r["id"] for r in recipes}) != len(recipes):
        raise ValueError("Recipe IDs must be unique.")

    dictionary = DictVectorizer(dtype=np.float32)
    ingredient_counts = dictionary.fit_transform(r["ingredients"] for r in recipes)
    weighting = TfidfTransformer()
    ingredients = weighting.fit_transform(ingredient_counts)

    # A phrase such as "pot pie" can carry information beyond either word.
    title_features = TfidfVectorizer(
        ngram_range=(1, 2), min_df=2, sublinear_tf=True, dtype=np.float32
    ).fit_transform(titles)

    # Each block is already row-normalized. Start with equal block weights.
    # Train on ingredient vocabulary. Keep the original quantity-weighted
    # matrix for the direct score so the two signals measure different things.
    ingredient_words = TfidfVectorizer(
        binary=True,
        min_df=2,
        dtype=np.float32,
    ).fit_transform(
        " ".join(recipe["ingredients"].keys()) for recipe in recipes
    )

    features = hstack([title_features, ingredient_words], format="csr")
    print(
        f"Training on {features.shape[0]:,} recipes × "
        f"{features.shape[1]:,} title/ingredient features...",
        flush=True,
    )

    start = perf_counter()
    model = TruncatedSVD(n_components=64, n_iter=7, random_state=42)
    vectors = normalize(model.fit_transform(features))
    print(f"Fit and normalization took {perf_counter() - start:.1f} seconds.")


    binary = vectors.astype("<f4").tobytes(order="C")
    idf = dict(zip(dictionary.get_feature_names_out(), map(float, weighting.idf_)))
    by_title = {title.casefold(): i for i, title in enumerate(titles)}

    # Reference pairs validate Python/browser parity. They do not affect training.
    checks = []
    for a, b in [("lasagna", "baked ziti"), ("apple pie", "apple crumble")]:
        if a not in by_title or b not in by_title:
            continue
        i, j = by_title[a], by_title[b]
        learned = float(vectors[i] @ vectors[j])
        direct = float(ingredients[i].multiply(ingredients[j]).sum())
        raw = 0.6 * learned + 0.4 * direct
        checks.append({"a": recipes[i]["id"], "b": recipes[j]["id"], "score": raw})
        print(f"{titles[i]} / {titles[j]}: {raw:.4f}")

    metadata = {
        "rows": len(recipes),
        "dimensions": vectors.shape[1],
        "catalogSha256": hashlib.sha256(catalog_text.encode()).hexdigest(),
        "vectorsSha256": hashlib.sha256(binary).hexdigest(),
        "idf": idf,
        "checks": checks,
    }
    (DATA / "recipe-vectors.bin").write_bytes(binary)
    (DATA / "recipe-vectors.meta.json").write_text(
        json.dumps(metadata, separators=(",", ":")) + "\n", encoding="utf-8"
    )
    print(f"Exported {vectors.shape} vectors ({len(binary) / 1024**2:.2f} MiB).")


if __name__ == "__main__":
    main()
