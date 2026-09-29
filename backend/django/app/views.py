"""Django HTTP adapters for the operations in app.backend."""

from django.http import JsonResponse
from django.views.decorators.http import require_GET

from . import backend


def _required_query(request):
    query = request.GET.get("query", "").strip()
    if not query:
        return JsonResponse({"error": {"code": "missing_query", "message": "query is required"}}, status=400)
    return query


@require_GET
def recipe_search(request):
    query = _required_query(request)
    if isinstance(query, JsonResponse):
        return query
    return JsonResponse(backend.get_recipe(query), safe=False)


@require_GET
def ingredient_search(request):
    query = _required_query(request)
    if isinstance(query, JsonResponse):
        return query
    return JsonResponse(backend.ingredients_search(query), safe=False)


@require_GET
def action_item_search(request):
    query = _required_query(request)
    if isinstance(query, JsonResponse):
        return query
    return JsonResponse(backend.action_items_search(query), safe=False)


def _random(request, operation):
    try:
        number = int(request.GET.get("number", ""))
    except ValueError:
        number = 0
    if number < 1:
        return JsonResponse({"error": {"code": "invalid_number", "message": "number must be at least 1"}}, status=400)
    return JsonResponse(operation(number), safe=False)


@require_GET
def random_recipes(request):
    return _random(request, backend.random_recipes)


@require_GET
def random_ingredients(request):
    return _random(request, backend.random_ingredients)


@require_GET
def random_action_items(request):
    return _random(request, backend.random_action_items)
