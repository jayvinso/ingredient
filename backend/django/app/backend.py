"""Backend interface required by the frontend.

These functions intentionally contain no implementation yet. Their signatures
mirror the operations documented in ``backend/swagger.yml``.
"""

from elasticsearch import Elasticsearch, helpers

es = Elasticsearch('https://es01:9200', ca_certs="/usr/share/elasticsearch/config/certs/ca/ca.crt", 
                       basic_auth=("elastic", "password"))

def get_recipe(query: str) -> str:
    """GET /recipes?query=... -> closest recipe as a string."""
    ingreds = dict()
    for i in query.split(","):
        ingreds[i] = 1

    res = es.search(index="recipes", body= {"query":{
        "sparse_vector": {
            "field": "description",
            "query_vector": ingreds
        }
    }})

    return str(res["hits"]["hits"][0]["_source"]["title"])


def ingredients_search(query: str) -> str:
    """GET /ingredients?query=... -> closest ingredient as a string."""

    res = es.search(index="ingredients", body= {"query":{
        "fuzzy": {
            "title": {
                "value": query
            }
        }
    }})
    return str(res["hits"]["hits"][0]["_source"]["title"])


def action_items_search(query: str) -> str:
    """GET /action-items?query=... -> closest action item as a string."""
    raise NotImplementedError


def random_recipes(number: int) -> list[str]:
    """GET /random/recipes?number=... -> random recipe strings."""
    raise NotImplementedError


def random_ingredients(number: int) -> list[str]:
    """GET /random/ingredients?number=... -> random ingredient strings."""
    raise NotImplementedError


def random_action_items(number: int) -> list[str]:
    """GET /random/action-items?number=... -> random action-item strings."""
    raise NotImplementedError
