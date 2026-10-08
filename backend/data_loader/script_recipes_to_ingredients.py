import json

ingredientSet = set()
index = 1

with open("backend/data_loader/ingredients2.json", "w", encoding="utf-8") as ingredient:
    ingredient.write("[\n")
    with open("backend/data_loader/recipes.json", "r", encoding="utf-8") as file:
        json_recipes = json.load(file)
        for line in json_recipes:
            for map in line["description"]:
                for currentIngredient in map.keys():
                    if currentIngredient not in ingredientSet:
                        ingredientSet.add(currentIngredient)

    for ingredient_name in ingredientSet:
        ingredient.write(f"{{\"_op_type\": \"index\", \"_index\": \"ingredients\", \"id\": {index}, \"title\": \"{ingredient_name}\"}},\n")
        index = index + 1
    ingredient.write("]\n")
