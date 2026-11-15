import os
import json
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")


def analyze_image_claim(image_path, claim=""):

    if not API_KEY:
        raise ValueError("GEMINI_API_KEY is missing")

    if not os.path.isfile(image_path):
        raise FileNotFoundError("Image file not found")

    client = genai.Client(api_key=API_KEY)

    prompt = f"""
You are VERITY, an image investigation assistant.

Analyze the uploaded image.

USER CLAIM:
{claim if claim.strip() else "No claim provided. Analyze the image independently."}

Return ONLY valid JSON:

{{
    "visual_description": "Detailed description of visible content",

    "ai_image_assessment": {{
        "verdict": "likely_ai_generated, likely_camera_captured, or uncertain",
        "observations": [],
        "limitations": []
    }},

    "claim_analysis": {{
        "claim": "{claim}",
        "consistency": "consistent, inconsistent, or unclear",
        "supporting_observations": [],
        "contradicting_observations": [],
        "cannot_determine": [],
        "conclusion": ""
    }}
}}

RULES:

1. Describe only what is actually visible.
2. Never invent dates, locations, people or events.
3. Assess AI generation cautiously.
4. Visual inspection cannot prove image authenticity.
5. Do not confuse realistic appearance with genuine origin.
6. Do not claim external verification without external evidence.
7. Distinguish visual observations from assumptions.
8. If uncertain, explicitly say uncertain.
9. If no claim is provided, use unclear for claim consistency.
10. Never invent evidence.
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

        if raw_text.startswith("```"):
            raw_text = raw_text.replace("```json", "", 1)
            raw_text = raw_text.replace("```", "").strip()

        try:
            analysis = json.loads(raw_text)

        except json.JSONDecodeError:
            return {
                "success": False,
                "error": "Gemini returned an invalid JSON response",
                "raw_analysis": raw_text
            }

        return {
            "success": True,
            "model": MODEL_NAME,
            "analysis": analysis,
            "notice": (
                "AI visual assessment is not definitive proof "
                "of image authenticity."
            )
        }

    except Exception as error:

        return {
            "success": False,
            "error": str(error)
        }