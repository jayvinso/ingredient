import re

def get_mult(str):
    return re.search("\d+[.\d*]? \d+/\d+", str)

f = open("recipes.csv")

f.readline()
x = re.split(r',\"\[\"\"', f.readline())


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