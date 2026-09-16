from django.shortcuts import render
from django.http import HttpResponse

from elasticsearch import Elasticsearch, helpers
import os
import json
import re

es = Elasticsearch('https://es01:9200', ca_certs="/usr/share/elasticsearch/config/certs/ca/ca.crt", 
                       basic_auth=("elastic", "password"))

def test(request):

    res = es.search(index="my-index", body= {"query":{
        "sparse_vector": {
        "field": "description",
        "query_vector": { "salt": 5, "seasoning": 1}
            }
        }})
    return HttpResponse(res["hits"]["hits"])