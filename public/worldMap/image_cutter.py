from PIL import Image
import os
import math

def generate_tiles(image_path, output_dir, tile_size=128, min_zoom_offset=3):
    """
    Découpe une image en tuiles et les sauvegarde dans une structure /tiles/{z}/{x}/{y}.png,
    en ignorant les trois premiers niveaux de zoom.

    :param image_path: Chemin de l'image source (PNG ou JPEG).
    :param output_dir: Répertoire où les tuiles seront générées.
    :param tile_size: Taille des tuiles (par défaut 128x128 pixels).
    :param min_zoom_offset: Nombre de niveaux à ignorer (par défaut 3).
    """
    # Charger l'image
    image = Image.open(image_path)
    width, height = image.size

    # Vérifier que l'image est carrée et un multiple de 2
    if width != height or not (math.log2(width).is_integer() and math.log2(height).is_integer()):
        raise ValueError("L'image doit être carrée et avoir une résolution qui est une puissance de 2 (1024, 2048, etc.).")

    # Calculer le niveau de zoom maximal
    max_zoom = int(math.log2(width // tile_size))

    # Ignorer les niveaux de zoom en dessous de `min_zoom_offset`
    for zoom in range(min_zoom_offset, max_zoom + 1):
        # Calculer la taille de l'image pour ce niveau de zoom
        scale = 2 ** (max_zoom - zoom)
        zoom_width = width // scale
        zoom_height = height // scale

        # Redimensionner l'image pour le niveau de zoom actuel
        resized_image = image.resize((zoom_width, zoom_height), Image.Resampling.LANCZOS)

        # Découper l'image en tuiles
        cols = zoom_width // tile_size
        rows = zoom_height // tile_size

        # Ajuster le niveau de zoom pour correspondre à la nouvelle numérotation (niveau 3 = 0)
        adjusted_zoom = zoom - min_zoom_offset

        for x in range(cols):
            for y in range(rows):
                # Calculer les coordonnées de la tuile
                left = x * tile_size
                upper = y * tile_size
                right = left + tile_size
                lower = upper + tile_size

                # Extraire la tuile
                tile = resized_image.crop((left, upper, right, lower))

                # Enregistrer la tuile
                tile_dir = os.path.join(output_dir, str(adjusted_zoom), str(x))
                os.makedirs(tile_dir, exist_ok=True)
                tile_path = os.path.join(tile_dir, f"{y}.png")
                tile.save(tile_path, "PNG")

                print(f"Généré : {tile_path}")

    print("Découpage terminé.")

# Configuration
source_image = "8192.png"  # Chemin de votre image source
output_directory = "tiles"         # Répertoire où les tuiles seront enregistrées
tile_dimension = 128               # Taille des tuiles (128x128 pixels)
min_zoom_offset = 3                # Ignorer les trois premiers niveaux

# Générer les tuiles
generate_tiles(source_image, output_directory, tile_dimension, min_zoom_offset)
