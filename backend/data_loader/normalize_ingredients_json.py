import json
from pathlib import Path

from ingredient_normalization import canonical_ingredient


source_path = Path(__file__).with_name("ingredients.json")
temporary_path = source_path.with_suffix(".json.tmp")
documents = json.loads(source_path.read_text(encoding="utf-8"))

normalized_documents = []
seen = set()

for document in documents:
    title = document.get("title")
    if not isinstance(title, str):
        raise ValueError(f"Ingredient record has no string title: {document!r}")

    canonical = canonical_ingredient(title)
    if canonical and canonical not in seen:
        seen.add(canonical)
        normalized_document = document.copy()
        normalized_document["title"] = canonical
        normalized_documents.append(normalized_document)

try:
    with temporary_path.open("w", encoding="utf-8", newline="\n") as output:
        output.write("[\n")
        for index, document in enumerate(normalized_documents):
            if index:
                output.write(",\n")
            json.dump(document, output, ensure_ascii=False)
        output.write("\n]\n")

    temporary_path.replace(source_path)
finally:
    temporary_path.unlink(missing_ok=True)

print(
    f"Normalized {len(normalized_documents)} unique ingredients "
    f"from {len(documents)} records."
)