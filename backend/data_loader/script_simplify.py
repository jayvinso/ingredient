import json

from ingredient_normalization import canonical_ingredient


ingredient_set = set()
index = 1

with open("ingredients.json", "w", encoding="utf-8") as output:
    output.write("[\n")
    with open(
        "foodb_2020_04_07_json/Content.json",
        "r",
        encoding="utf-8",
    ) as source:
        first = True
        for line in source:
            current_line = json.loads(line)
            common_name = current_line["orig_food_common_name"]

            if common_name is None:
                continue

            canonical = canonical_ingredient(common_name.split(",")[0])
            if not canonical or canonical in ingredient_set:
                continue

            ingredient_set.add(canonical)
            if not first:
                output.write(",\n")

            json.dump(
                {
                    "_op_type": "index",
                    "_index": "ingredients",
                    "id": index,
                    "title": canonical,
                },
                output,
                ensure_ascii=False,
            )
            first = False
            index += 1

    output.write("\n]\n")
