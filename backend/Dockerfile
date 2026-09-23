###################################################
# Stage: base
# 
# This base stage ensures all other stages are using the same base image
# and provides common configuration for all stages, such as the working dir.
###################################################
FROM node:22 AS base
WORKDIR /usr/local/app


###################################################
# Stage: backend-base
#
# This stage is used as the base for the backend-dev and test stages, since
# there are common steps needed for each.
###################################################
FROM python:3 AS backend-dev
COPY backend/django/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/django/app ./app
COPY backend/django/ingredient_backend ./ingredient_backend
COPY backend/django/manage.py ./
COPY backend/django/db.sqlite3 ./
CMD [ "python", "manage.py", "runserver", "0.0.0.0:8000"]


###################################################
# Stage: load data
#
# This stage loads data into elastic search 
###################################################
FROM python:3 AS data
COPY backend/data_loader/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/data_loader/recipes.json ./
COPY backend/data_loader/load_recipes.py ./
CMD [ "python", "load_recipes.py"]
