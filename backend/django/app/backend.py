"""Backend interface required by the frontend.

These functions intentionally contain no implementation yet. Their signatures
mirror the operations documented in ``backend/swagger.yml``.
"""

from elasticsearch import Elasticsearch, helpers
from difflib import SequenceMatcher
from functools import lru_cache
from time import monotonic
import re

es = Elasticsearch('https://es01:9200', ca_certs="/usr/share/elasticsearch/config/certs/ca/ca.crt", 
                       basic_auth=("elastic", "password"))

def _ingredient_words(name: str) -> frozenset[str]:
    """Normalize capitalization and common plurals."""
    words = []

    for word in re.findall(r"[a-z0-9]+", name.casefold()):
        if word in {"of", "the", "and", "with"}:
            continue

        if word.endswith("ies") and len(word) > 4:
            word = word[:-3] + "y"
        elif word.endswith("oes") and len(word) > 4:
            word = word[:-2]
        elif (
            word.endswith("s")
            and len(word) > 3
            and not word.endswith(("ss", "us", "is"))
        ):
            word = word[:-1]

        words.append(word)

    return frozenset(words)


def _ingredient_similarity(
    requested: frozenset[str],
    candidate: frozenset[str],
) -> float:
    """Exact names first; spelling and shared words are weaker clues."""
    if not requested or not candidate:
        return 0.0

    if requested == candidate:
        return 1.0

    shared = requested & candidate

    if shared:
        return 0.2 * (
            2 * len(shared) / (len(requested) + len(candidate))
        )

    # Only accept very close spelling matches.
    similarity = SequenceMatcher(
        None,
        " ".join(sorted(requested)),
        " ".join(sorted(candidate)),
    ).ratio()

    return 0.35 * similarity if similarity >= 0.90 else 0.0


@lru_cache(maxsize=1)
def _recipe_ingredient_names(cache_period: int) -> tuple[str, ...]:
    """Read actual recipe ingredient names, cached for about one minute."""
    names = set()

    for hit in helpers.scan(
        es,
        index="recipes",
        query={
            "query": {"match_all": {}},
            "_source": {
                "includes": ["description"],
                "exclude_vectors": False,
            },
        },
    ):
        description = hit.get("_source", {}).get("description", {})
        vectors = (
            description
            if isinstance(description, list)
            else [description]
        )

        for vector in vectors:
            if isinstance(vector, dict):
                names.update(
                    name for name in vector
                    if isinstance(name, str)
                )

    return tuple(sorted(names))


def _recipe_match_details(source, requested, choices):
    title = source.get("title")
    if not isinstance(title, str) or not title.strip():
        return None

    description = source.get("description", {})
    vectors = description if isinstance(description, list) else [description]

    names = set()
    for vector in vectors:
        if isinstance(vector, dict):
            names.update(
                name for name in vector
                if isinstance(name, str)
            )
    names = sorted(names, key=str.casefold)

    # One selected item cannot cover multiple recipe ingredients.
    edges = []
    for selected_index, options in enumerate(choices):
        for recipe_index, name in enumerate(names):
            weight = options.get(name, 0.0)
            if weight > 0:
                edges.append((weight, selected_index, recipe_index))

    edges.sort(key=lambda edge: (-edge[0], edge[1], edge[2]))

    selected_used = set()
    recipe_used = set()
    exact_recipe = set()
    matched = []
    approximate = []
    total_weight = 0.0

    for weight, selected_index, recipe_index in edges:
        if (
            selected_index in selected_used
            or recipe_index in recipe_used
        ):
            continue

        selected_used.add(selected_index)
        recipe_used.add(recipe_index)
        total_weight += weight

        selected_name = requested[selected_index][0]

        if weight == 1.0:
            matched.append(selected_name)
            exact_recipe.add(recipe_index)
        else:
            approximate.append({
                "selected": selected_name,
                "recipe_ingredient": names[recipe_index],
            })

    if not selected_used:
        return None

    # A related food is not assumed to be an available substitution.
    missing = [
        name for index, name in enumerate(names)
        if index not in exact_recipe
    ]

    unmatched = [
        name for index, (name, _) in enumerate(requested)
        if index not in selected_used
    ]

    title_words = _ingredient_words(title)
    title_match = sum(
        len(words & title_words) / len(words)
        for _, words in requested
    )

    level = (
        "strong"
        if len(matched) == len(requested) and not missing
        else "partial"
        if matched
        else "weak"
    )

    # Exact matches first, then related matches, title clues,
    # and fewer missing ingredients.
    rank = (
        len(matched),
        total_weight,
        title_match,
        -len(missing),
    )

    result = {
        "title": title.strip(),
        "text": title.strip(),
        "match_level": level,
        "matched_ingredients": matched,
        "approximate_matches": approximate,
        "missing_ingredients": missing,
        "unmatched_ingredients": unmatched,
    }

    return rank, result


def get_recipe(query: str) -> dict | None:
    """Retrieve candidates, then rank and explain the closest match."""
    requested = []
    seen = set()

    for name in query.split(","):
        name = " ".join(name.split())
        words = _ingredient_words(name)

        if words and words not in seen:
            requested.append((name, words))
            seen.add(words)

    if not requested:
        return None

    candidates = [
        (name, _ingredient_words(name))
        for name in _recipe_ingredient_names(int(monotonic() // 60))
    ]

    ingredients = {}
    choices = []

    for _, words in requested:
        exact = {
            name: 1.0
            for name, candidate in candidates
            if candidate == words
        }

        if exact:
            options = exact
        else:
            related = {
                name: _ingredient_similarity(words, candidate)
                for name, candidate in candidates
            }

            best_weight = max(related.values(), default=0.0)

            options = {
                name: weight
                for name, weight in related.items()
                if weight > 0
                and abs(weight - best_weight) < 0.000001
            }

        choices.append(options)

        for name, weight in options.items():
            ingredients[name] = max(
                ingredients.get(name, 0.0),
                weight,
            )

    if not ingredients:
        return None

    res = es.search(
        index="recipes",
        body={
            "size": 200,
            "_source": {
                "includes": ["title", "description"],
                "exclude_vectors": False,
            },
            "query": {
                "sparse_vector": {
                    "field": "description",
                    "query_vector": ingredients,
                    "prune": False,
                }
            },
        },
    )

    ranked = []

    for hit in res["hits"]["hits"]:
        match = _recipe_match_details(
            hit.get("_source", {}),
            requested,
            choices,
        )

        if match is not None:
            ranked.append(match)

    if not ranked:
        return None

    # Make otherwise identical ties predictable.
    ranked.sort(key=lambda entry: entry[1]["title"].casefold())

    return max(ranked, key=lambda entry: entry[0])[1]

def ingredients_search(query: str) -> list[str]:
    """Return up to six ingredient names, ordered by search relevance."""
    query = query.strip()
    if not query:
        return []

    res = es.search(
        index="ingredients",
        body={
            "size": 6,
            "_source": ["title"],
            "query": {
                "bool": {
                    "should": [
                        {
                            "match_phrase_prefix": {
                                "title": {
                                    "query": query,
                                    "boost": 2,
                                }
                            }
                        },
                        {
                            "match": {
                                "title": {
                                    "query": query,
                                    "fuzziness": "AUTO",
                                    "operator": "and",
                                }
                            }
                        },
                    ],
                    "minimum_should_match": 1,
                }
            },
        },
    )

    names = []
    seen = set()

    for hit in res["hits"]["hits"]:
        title = hit.get("_source", {}).get("title")
        if not isinstance(title, str):
            continue

        name = title.strip()
        if name and name.casefold() not in seen:
            names.append(name)
            seen.add(name.casefold())

    return names


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
