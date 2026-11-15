from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pathlib import Path
import tempfile
import os
import shutil

from reverse_search import analyze_image_claim
from google_lens import reverse_image_search


app = FastAPI(
    title="VERITY API",
    description="AI-powered image investigation system",
    version="4.0"
)


@app.get("/")
def home():
    return {
        "message": "VERITY API is running!",
        "status": "online",
        "version": "4.0"
    }


@app.post("/analyze/ai")
async def analyze_image(
    file: UploadFile = File(...),
    claim: str = Form("")
):

    allowed_formats = [".jpg", ".jpeg", ".png", ".webp", ".bmp"]

    filename = file.filename or "uploaded_image.jpg"
    extension = Path(filename).suffix.lower()

    if extension not in allowed_formats:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format"
        )

    temp_dir = None

    try:
        content = await file.read()

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Empty file"
            )

        temp_dir = tempfile.mkdtemp(prefix="verity_")

        image_path = os.path.join(
            temp_dir,
            "uploaded_image" + extension
        )

        with open(image_path, "wb") as image_file:
            image_file.write(content)

        # Gemini: Image description, AI assessment and claim analysis
        gemini_result = analyze_image_claim(
            image_path,
            claim
        )

        if not gemini_result.get("success"):
            raise HTTPException(
                status_code=502,
                detail={
                    "message": "Gemini analysis failed",
                    "error": gemini_result.get("error")
                }
            )

        analysis = gemini_result.get("analysis", {})

        return {
            "success": True,
            "filename": filename,

            "analysis": {
                "ai_detection": analysis.get(
                    "ai_image_assessment", {}
                ),

                "visual_description": analysis.get(
                    "visual_description", ""
                ),

                "gemini_claim_analysis": {
                    "success": True,
                    "analysis": analysis.get(
                        "claim_analysis", {}
                    ),
                    "model": gemini_result.get("model"),
                    "notice": gemini_result.get("notice")
                }
            }
        }

    except HTTPException:
        raise

    except Exception as error:

        print("VERITY ERROR:", error)

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

        await file.close()


@app.post("/analyze/reverse-search")
async def reverse_search_image(
    file: UploadFile = File(...)
):

    allowed_formats = [".jpg", ".jpeg", ".png", ".webp", ".bmp"]

    filename = file.filename or "uploaded_image.jpg"
    extension = Path(filename).suffix.lower()

    if extension not in allowed_formats:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image format"
        )

    temp_dir = None

    try:
        content = await file.read()

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Empty file"
            )

        temp_dir = tempfile.mkdtemp(prefix="verity_lens_")

        image_path = os.path.join(
            temp_dir,
            "uploaded_image" + extension
        )

        with open(image_path, "wb") as image_file:
            image_file.write(content)

        result = reverse_image_search(image_path)

        return {
            "success": True,
            "filename": filename,
            "google_lens": result
        }

    except HTTPException:
        raise

    except Exception as error:

        print("GOOGLE LENS ERROR:", error)

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

        await file.close()