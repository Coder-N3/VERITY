from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pathlib import Path
import tempfile
import os
import shutil

from python_service.ai_detector import detect_ai_image
from python_service.ela import analyze_ela
from python_service.copy_move import analyze_copy_move
from python_service.reverse_search import analyze_image_claim
from python_service.google_lens import reverse_image_search
from python_service.metadata import extract_metadata


app = FastAPI(
    title="VERITY API",
    description="Multi-method image authenticity analysis system",
    version="3.0"
)


@app.get("/")
def home():
    return {
        "message": "VERITY API is running!",
        "status": "online"
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

        # 1. Extract Image Metadata
        metadata = extract_metadata(image_path)
        metadata["filename"] = filename

        # 2. AI Image Detection
        ai_result = detect_ai_image(image_path)

        # 3. ELA Analysis
        ela_output = os.path.join(
            temp_dir,
            "ela_result.png"
        )

        ela_result = analyze_ela(
            image_path,
            ela_output
        )

        # 4. Copy-Move Analysis
        copy_move_output = os.path.join(
            temp_dir,
            "copy_move_result.jpg"
        )

        copy_move_result = analyze_copy_move(
            image_path,
            copy_move_output
        )

        # 5. Gemini Claim Analysis
        gemini_result = None

        if claim.strip():
            try:
                gemini_result = analyze_image_claim(
                    image_path,
                    claim
                )

            except Exception as error:
                gemini_result = {
                    "success": False,
                    "error": str(error)
                }

        return {
            "success": True,
            "filename": filename,
            "metadata": metadata,

            "analysis": {
                "ai_detection": ai_result,

                "ela_analysis": {
                    "success": True,
                    "result_image": ela_result
                },

                "copy_move_analysis": copy_move_result,

                "gemini_claim_analysis": gemini_result
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
