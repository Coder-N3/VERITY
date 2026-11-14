from pathlib import Path
from python_service.google_lens import reverse_image_search


image_path = Path("python_service/test.jpg")

print("Starting Google Lens search...")

try:
    result = reverse_image_search(str(image_path))

    print("\nSEARCH RESULT:")
    print(result)

except Exception as error:
    print("\nSEARCH FAILED:")
    print(error)