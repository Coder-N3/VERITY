from PIL import Image, ImageChops, ImageEnhance
import os
from io import BytesIO


def analyze_ela(image_path, output_path):

    with Image.open(image_path) as img:
        original = img.convert("RGB")

    # Recompress the image
    buffer = BytesIO()

    original.save(
        buffer,
        format="JPEG",
        quality=90
    )

    buffer.seek(0)

    compressed = Image.open(buffer).convert("RGB")

    # Calculate differences
    difference = ImageChops.difference(
        original,
        compressed
    )

    enhancer = ImageEnhance.Brightness(difference)

    ela_image = enhancer.enhance(10)

    # Save result
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    ela_image.save(output_path)

    return output_path