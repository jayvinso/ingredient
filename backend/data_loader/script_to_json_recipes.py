import csv
import re
from fractions import Fraction

leftover = []

# volumes are in oz
def read_weighted_conversions() -> dict[str, float]:
    conversions = {}
    with open("backend/data_loader/weighted_conversions.csv", "r", encoding="utf-8") as file:
        for row in csv.reader(file):
            if len(row) >= 2:
                try:
                    conversions[row[0].strip()] = float(row[1])
                except ValueError:
                    continue
    return conversions

conversions = read_weighted_conversions()

def get_mult(s):
    match = re.match(r"(\d+\s)?(\d+\/\d+)?", s)
    #print(match.groups())

    #print(Fraction(part) for part in match.groups() if part is not None)
    val = float(sum(Fraction(part) for part in match.groups() if part is not None))
    if val == 0:
        return 1
    else:
        return val

def get_volume(s):
    match = re.match(r"(?:(\d+\s)?(\d+\/\d+)?)(.*)", s)
    after = match.groups()[-1].strip()
    measurement = ""
    for x in conversions.keys():
        if x in after:
            return conversions[x]
    return 1
        
def get_weight(s):
    mult = get_mult(s)
    vol = get_volume(s)
    return vol * mult

def get_weighted_ingredients(ingredients, volumes):
    weights = dict()
    total = 0
    for i in ingredients:
        s = [x for x in volumes if i in x]
        w = 1
        if len(s) > 0:
            s = s[0]
            w = get_weight(s)
        total += w
        weights[i] = w
    #print(ingredients)
    #print(volumes)
    #print(weights)
    return (weights, total)

def parse_list(s):
    return [re.sub("[\':\",\[\]]", "", i).strip() for i in s.split('\",')]

index = 1



with open("backend/data_loader/recipes.json", "w", encoding="utf-8") as recipe:
    recipe.write("[\n")
    with open("backend/data_loader/recipes_full.csv", "r", encoding="utf-8") as file:
        csvFile = csv.reader(file)
        for line in csvFile:
            if line[1] is not None and index != 1:
                #print(line[1])
                #print(line[3])
                #print(line[6])
                # Title of recipe
                currentRecipe = re.sub("\"", "", line[1]).replace("\t", "")

                # Detailed instructions
                instructions = re.sub("\"", "", line[3])
                
                str_instructions = ""
                for instruction in instructions:
                    str_instructions = str_instructions + instruction
                str_instructions = re.sub("[\':\",\[\]]", "", str_instructions).strip().replace("\\", "\\\\").replace("\t", "")

                # List of ingredients
                ingredients = parse_list(line[6])

                ingred_weights, total = get_weighted_ingredients(ingredients, parse_list(line[2]))

                new_ingredients = []
                for ingredient in ingredients:
                    new_ingredients.append(ingredient + ": " + str(ingred_weights[ingredient] / total))
                ingredientList = str(new_ingredients).replace('\'', '\"').replace("\",", ",").replace(":", "\":")[1:-2]
                if index > 2:
                    recipe.write(",\n")
                recipe.write(f"{{\"_op_type\": \"index\", \"_index\": \"recipes\", \"id\": {index}, \"title\": \"{currentRecipe}\", \"description\": [{{{ingredientList}}}], \"instructions\": \"{str_instructions}\"}}")
            index = index + 1
            if index > 100000:
                break
    recipe.write("\n]\n")

