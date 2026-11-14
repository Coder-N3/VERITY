from PIL import Image, UnidentifiedImageError
from PIL.ExifTags import TAGS
import os
import sys
import json


MAX_FILE_SIZE = 10 * 1024 * 1024


def extract_metadata(image_path):

    if not os.path.exists(image_path):
        raise ValueError("Image file does not exist.")

    file_size = os.path.getsize(image_path)

    if file_size > MAX_FILE_SIZE:
        raise ValueError("Image exceeds the 10 MB size limit.")

    # First, verify the image
    with Image.open(image_path) as image:
        image.verify()

    # Reopen because verify() invalidates the image object
    with Image.open(image_path) as image:

        image.load()

        metadata = {
            "filename": os.path.basename(image_path),
            "format": image.format,
            "width": image.width,
            "height": image.height,
            "size_bytes": file_size,
            "mode": image.mode,
            "is_valid_image": True,
            "exif": {}
        }

        exif_data = image.getexif()

        for tag_id, value in exif_data.items():

            tag_name = TAGS.get(tag_id, tag_id)

            metadata["exif"][str(tag_name)] = str(value)

        return metadata


if __name__ == "__main__":

    try:
        image_path = sys.argv[1]

        result = extract_metadata(image_path)

        print(json.dumps(result, indent=4))

    except (ValueError, OSError, UnidentifiedImageError, IndexError) as error:

        print(json.dumps({
            "is_valid_image": False,
            "error": str(error)
        }, indent=4))