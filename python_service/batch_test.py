import os
from pathlib import Path
from ai_detector import detect_ai_image


# Folder containing test images
IMAGE_FOLDER = Path(__file__).parent / "test_images"

# Supported image formats
SUPPORTED_FORMATS = (".jpg", ".jpeg", ".png", ".webp", ".bmp")


def batch_test():

    images = [
        file for file in IMAGE_FOLDER.iterdir()
        if file.is_file() and file.suffix.lower() in SUPPORTED_FORMATS
    ]

    if not images:
        print("No images found in test_images folder.")
        return

    print("\n================================")
    print("       VERITY BATCH TEST")
    print("================================")

    total = len(images)
    successful = 0
    failed = 0

    for index, image_path in enumerate(images, start=1):

        print(f"\n[{index}/{total}] Testing: {image_path.name}")
        print("--------------------------------")

        try:

            result = detect_ai_image(str(image_path))

            if result["success"]:

                successful += 1

                print("Prediction:", result["prediction"])
                print("\nScores:")

                for label, score in result["scores"].items():
                    print(f"{label}: {score}%")

            else:
                failed += 1
                print("Error:", result.get("error"))

        except Exception as error:
            failed += 1
            print("Error:", error)

    print("\n================================")
    print("         FINAL SUMMARY")
    print("================================")
    print("Total images:", total)
    print("Successful:", successful)
    print("Failed:", failed)
    print("================================")


if __name__ == "__main__":
    batch_test()