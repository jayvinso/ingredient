from django.urls import path

from . import views

urlpatterns = [
    path("recipes", views.recipe_search, name="recipe-search"),
    path("ingredients", views.ingredient_search, name="ingredient-search"),
    path("action-items", views.action_item_search, name="action-item-search"),
    path("random/recipes", views.random_recipes, name="random-recipes"),
    path("random/ingredients", views.random_ingredients, name="random-ingredients"),
    path("random/action-items", views.random_action_items, name="random-action-items"),
]
