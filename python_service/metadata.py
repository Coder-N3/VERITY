from PIL import Image, UnidentifiedImageError
from PIL.ExifTags import TAGS
import os


MAX_FILE_SIZE = 10 * 1024 * 1024


def extract_metadata(image_path):

    if not os.path.exists(image_path):
        raise ValueError("Image file does not exist.")

    file_size = os.path.getsize(image_path)

    if file_size > MAX_FILE_SIZE:
        raise ValueError("Image exceeds the 10 MB size limit.")

    with Image.open(image_path) as image:
        image.verify()

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