import json

ingredientSet = set()
index = 1

with open("ingredients.json", "w", encoding="utf-8") as ingredient:
    ingredient.write("[\n")
    with open("foodb_2020_04_07_json/Content.json", "r", encoding="utf-8") as file:
        for line in file:
            currentLine = json.loads(line)
            if currentLine["orig_food_common_name"] is not None:
                currentIngredient = currentLine["orig_food_common_name"].split(",")[0]
                if currentIngredient not in ingredientSet:
                    ingredientSet.add(currentIngredient)
                    ingredient.write(f"{{\"_op_type\": \"index\", \"_index\": \"ingredients\", \"id\": {index}, \"title\": \"{currentIngredient}\"}},\n")
                    index = index + 1

    ingredient.write("]\n")
