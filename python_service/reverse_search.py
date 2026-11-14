import os
import json
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from PIL import Image


# Load environment variables from VERITY/.env
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")


def analyze_image_claim(image_path, claim):

    if not API_KEY:
        raise ValueError("GEMINI_API_KEY is missing from .env")

    if not os.path.isfile(image_path):
        raise FileNotFoundError("Image file not found.")

    if not claim or not claim.strip():
        raise ValueError("Please provide a claim to investigate.")

    client = genai.Client(api_key=API_KEY)

    prompt = f"""
You are an image-analysis assistant for VERITY,
a platform designed to help people investigate online claims.

Analyze the uploaded image in relation to this claim:

CLAIM: {claim}

Return ONLY valid JSON with these fields:

{{
    "visual_description": "Describe what is visibly present.",
    "claim_consistency": "consistent, inconsistent, or unclear",
    "supporting_observations": [],
    "contradicting_observations": [],
    "cannot_determine": [],
    "conclusion": "A short, cautious explanation."
}}

IMPORTANT RULES:

1. Only describe evidence actually visible in the image.
2. Never invent dates, locations, people, or events.
3. Do not claim that the image is genuine just because it looks realistic.
4. Do not claim that an event happened based only on the image.
5. Clearly distinguish observations from assumptions.
6. If evidence is insufficient, say unclear.
7. Do not invent reverse-search results or external sources.
8. Do not treat your analysis as definitive proof.
"""

    try:
        with Image.open(image_path) as original:
            image = original.convert("RGB")

        response = client.models.generate_content(
    model=MODEL_NAME,
    contents=[prompt, image],
    config={
        "http_options": {
            "timeout": 120000
        }
    }
)

        raw_text = response.text.strip()

        # Remove optional Markdown formatting
        if raw_text.startswith("```"):
            raw_text = raw_text.replace("```json", "", 1)
            raw_text = raw_text.replace("```", "").strip()

        try:
            analysis = json.loads(raw_text)
        except json.JSONDecodeError:
            analysis = {
                "raw_analysis": raw_text
            }

        return {
            "success": True,
            "model": MODEL_NAME,
            "analysis": analysis,
            "notice": (
                "AI visual analysis is not proof of image "
                "authenticity or event authenticity."
            )
        }

    except Exception as error:
        return {
            "success": False,
            "error": str(error)
        }