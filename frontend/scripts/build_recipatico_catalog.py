import json
import math
from pathlib import Path

frontend = Path(__file__).resolve().parents[1]
source = frontend.parent / "backend/data_loader/recipes.json"
target = frontend / "src/components/recipatico/data/recipe-catalog.json"


def clean(text):
    return " ".join(text.split())


def build_catalog(records):
    catalog = []
    seen_titles = set()

    for record in records:
        recipe = record.get("_source", record)
        title = clean(recipe.get("title") or "")
        key = title.casefold()
        if not title or key in seen_titles:
            continue

        description = recipe.get("description") or []
        vectors = [description] if isinstance(description, dict) else description
        ingredients = {}
        for vector in vectors:
            if not isinstance(vector, dict):
                continue
            for ingredient, weight in vector.items():
                if not isinstance(weight, (int, float)) or not math.isfinite(weight) or weight <= 0:
                    continue
                name = clean(ingredient).casefold()
                if name:
                    ingredients[name] = ingredients.get(name, 0) + weight

        if ingredients:
            seen_titles.add(key)
            catalog.append({
                "id": str(recipe["id"]),
                "title": title,
                "ingredients": ingredients,
            })

    return sorted(catalog, key=lambda recipe: recipe["title"].casefold())


if __name__ == "__main__":
    with source.open(encoding="utf-8-sig") as stream:
        catalog = build_catalog(json.load(stream))

    if not catalog:
        raise SystemExit("No playable recipes found. Check the export format.")

    target.parent.mkdir(parents=True, exist_ok=True)
    output = json.dumps(catalog, ensure_ascii=False, separators=(",", ":"))
    target.write_text(output + "\n", encoding="utf-8")
    print(f"Generated {len(catalog):,} recipes ({target.stat().st_size / 1024**2:.2f} MiB).")
    print("Example titles:", ", ".join(recipe["title"] for recipe in catalog[:5]))
