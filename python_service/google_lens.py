import requests
import imagehash
from io import BytesIO
import os
import tempfile
from pathlib import Path

import serpapi
from dotenv import load_dotenv
from PIL import Image, ImageOps


# Load VERITY/.env
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")


def compress_image(image_path):

    image = Image.open(image_path)
    image = ImageOps.exif_transpose(image)

    if image.mode != "RGB":
        image = image.convert("RGB")

    temp_file = tempfile.NamedTemporaryFile(
        suffix=".jpg",
        delete=False
    )

    temp_path = temp_file.name
    temp_file.close()

    # Try different image sizes and compression levels
    for scale in [1.0, 0.85, 0.7, 0.55, 0.4]:

        resized = image.copy()

        if scale < 1:
            new_size = (
                int(image.width * scale),
                int(image.height * scale)
            )
            resized = resized.resize(new_size)

        for quality in [90, 80, 70, 60, 50, 40, 30]:

            resized.save(
                temp_path,
                format="JPEG",
                quality=quality,
                optimize=True
            )

            if os.path.getsize(temp_path) <= 500 * 1024:
                image.close()
                resized.close()
                return temp_path

        resized.close()

    image.close()
    os.remove(temp_path)

    raise ValueError("Could not compress image below 500 KB.")

def calculate_similarity(original_path, thumbnail_url):

    try:
        original = Image.open(original_path)
        original = ImageOps.exif_transpose(original).convert("RGB")

        response = requests.get(thumbnail_url, timeout=15)
        response.raise_for_status()

        matched = Image.open(BytesIO(response.content))
        matched = ImageOps.exif_transpose(matched).convert("RGB")

        hash_original = imagehash.phash(original)
        hash_matched = imagehash.phash(matched)

        difference = hash_original - hash_matched

        total_bits = hash_original.hash.size

        similarity = (1 - difference / total_bits) * 100

        original.close()
        matched.close()

        return round(similarity, 2)

    except Exception as error:
        print("Similarity calculation failed:", error)
        return None

def reverse_image_search(image_path):

    api_key = os.getenv("SERPAPI_API_KEY")

    if not api_key:
        raise ValueError("SERPAPI_API_KEY is missing from .env")

    if not os.path.isfile(image_path):
        raise FileNotFoundError("Image file not found.")

    compressed_path = None

    try:

        # 1. Compress image
        compressed_path = compress_image(image_path)

        # 2. Connect to SerpApi
        client = serpapi.Client(
            api_key=api_key,
            timeout=60
        )

        # 3. Upload image
        upload = client.upload_image(compressed_path)

        print("Image uploaded. Response:", upload)

        if upload.get("error"):
            raise RuntimeError(upload["error"])

        image_id = upload.get("image_id")

        if not image_id:
            raise RuntimeError("Image upload failed.")

        # 4. Search using Google Lens
        print("Starting Google Lens search...")
        results = client.search({
            "engine": "google_lens",
            "image_id": image_id,
            "type": "visual_matches",
            "hl": "en"
        })

        if results.get("error"):
            raise RuntimeError(results["error"])

                # 5. Extract and compare matching results
        matches = []

        for item in results.get("visual_matches", [])[:10]:

            thumbnail_url = item.get("thumbnail")

            if not thumbnail_url:
                continue

            similarity = calculate_similarity(
                image_path,
                thumbnail_url
            )

            if similarity is None or similarity < 85:
                continue

            if similarity == 100:
                match_type = "Potential exact match"
            else:
                match_type = "High similarity"

            matches.append({
                "title": item.get("title"),
                "source": item.get("source"),
                "link": item.get("link"),
                "thumbnail": thumbnail_url,
                "similarity": similarity,
                "match_type": match_type
            })

        print("Qualifying matches:", len(matches))
        

        return {
            "success": True,
            "total_matches": len(matches),
            "matches": matches
        }

    finally:

        if compressed_path and os.path.exists(compressed_path):
            os.remove(compressed_path)