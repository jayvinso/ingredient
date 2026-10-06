# Script that removes extraneous files

import os

image_path = "C:\\Users\\oberl\\OneDrive - The Ohio State University\\CSE_5914_Data\\ingredients\\Ingredient_Images\\bing_images"

for image_folder in os.listdir(image_path):
    images_to_delete = ["1.jpg", "2.jpg", "3.jpg", "4.jpg"]
    for image_to_delete in images_to_delete:
        if os.path.exists(image_path + "\\" + image_folder + "\\" + image_to_delete):
            print(image_folder + "\\" + image_to_delete)
            os.remove(image_path + "\\" + image_folder + "\\" + image_to_delete)
        else:
            print("Image not found")