import csv
import re

index = 1

with open("backend/data_loader/recipes.json", "w", encoding="utf-8") as recipe:
    recipe.write("[\n")
    with open("backend/data_loader/recipes.csv", "r", encoding="utf-8") as file:
        csvFile = csv.reader(file)
        for line in csvFile:
            if line[1] is not None:
                currentRecipe = re.sub("\"", "", line[1])
                instructions = re.sub("\"", "", line[3])
                ingredients = set(line[6].split(','))
                new_ingredients = []
                weight = round(1/len(ingredients), 3)
                for ingredient in ingredients:
                    new_ingredients.append(re.sub("[\':\",\[\]]", "", ingredient).strip() + ": " + str(weight))
                ingredientList = str(new_ingredients).replace('\'', '\"').replace("\",", ",").replace(":", "\":")[1:-2]
                recipe.write(f"{{\"_op_type\": \"index\", \"_index\": \"recipes\", \"id\": {index}, \"title\": \"{currentRecipe}\", \"description\": [{{{ingredientList}}}]}},\n")
                index = index + 1

    recipe.write("]\n")