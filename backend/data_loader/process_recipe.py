import re

# Change anything you want in this file, how I was doing it probably wasn't a great way to do it anyways
# - Kurt

def get_mult(str):
    # Regex things like this: "3 3/4"
    return re.search("\d+[.\d*]? \d+/\d+", str)

f = open("recipes.csv")

f.readline() # removes header
x = re.split(r',\"\[\"\"', f.readline())

print(x[0])
title = x[0].split(",")[1]


items = x[len(x) - 1]

items = re.sub(r'["\]\n]', "", items)

items = items.split(', ')

ingreds = x[1]
ingreds = re.sub(r'["\]\n]', "", ingreds)
ingreds = ingreds.split(', ')

for i in ingreds:
    print(i)
    print(get_mult(i))




f.close()