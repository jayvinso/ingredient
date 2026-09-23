from elasticsearch import Elasticsearch, helpers
import os
import json
import re
import time

es = Elasticsearch('https://es01:9200', ca_certs="/usr/share/elasticsearch/config/certs/ca/ca.crt", 
                       basic_auth=("elastic", "password"))

try:
    es.indices.delete(index="recipes")
except:
    print("Creating index")

settings = {
    "index.mapping.exclude_source_vectors": False
}

mappings = {
    "properties": {
        "title": {
            "type": "text"
        },
        "description": {
            "type": "sparse_vector"
        } 
    }
}

es.indices.create(index="recipes", mappings=mappings, settings=settings)

print("Hello world")

with open("recipes.json") as file:
    docs = json.loads(file.read())
    # print(docs)
    helpers.bulk(es, docs )


time.sleep(100000)