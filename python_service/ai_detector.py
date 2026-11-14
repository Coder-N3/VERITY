from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch
import sys
import json
import os


MODEL_ID = "delpot/steganograph-ia-detector"

# Load model only once
processor = AutoImageProcessor.from_pretrained(MODEL_ID)
model = AutoModelForImageClassification.from_pretrained(MODEL_ID)

model.eval()


def detect_ai_image(image_path):

    if not os.path.exists(image_path):
        raise FileNotFoundError("Image not found")

    # Load image
    with Image.open(image_path) as img:
        image = img.convert("RGB")

    # Prepare image
    inputs = processor(image, return_tensors="pt")

    # Run prediction
    with torch.no_grad():
        outputs = model(**inputs)

    # Calculate scores
    probabilities = torch.softmax(outputs.logits, dim=-1)[0]

    scores = {}

    for index, score in enumerate(probabilities):
        label = model.config.id2label[index]
        scores[label] = round(score.item() * 100, 2)

    predicted_index = probabilities.argmax().item()
    predicted_label = model.config.id2label[predicted_index]

    return {
        "success": True,
        "prediction": predicted_label,
        "scores": scores,
        "model": MODEL_ID
    }


if __name__ == "__main__":

    try:

        if len(sys.argv) < 2:
            raise ValueError("Please provide an image path")

        image_path = sys.argv[1]

        result = detect_ai_image(image_path)

        print(json.dumps(result, indent=4))

    except Exception as error:

        print(json.dumps({
            "success": False,
            "error": str(error)
        }, indent=4))
