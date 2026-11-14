import cv2
import sys
import os
import json


def analyze_copy_move(image_path, output_path):

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("Unable to read image.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Create ORB detector
    orb = cv2.ORB_create(nfeatures=1500)

    # Detect keypoints and descriptors
    keypoints, descriptors = orb.detectAndCompute(gray, None)

    if descriptors is None or len(keypoints) < 2:
        return {
            "success": True,
            "message": "Not enough visual features detected.",
            "keypoints": len(keypoints)
        }

    # Match image features
    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)

    matches = matcher.match(descriptors, descriptors)

    # Remove each feature's match with itself
    matches = [
        match for match in matches
        if match.queryIdx != match.trainIdx
    ]

    # Save a visualisation of matching features
    result = cv2.drawMatches(
        image,
        keypoints,
        image,
        keypoints,
        matches[:50],
        None,
        flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS
    )
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    cv2.imwrite(output_path, result)

    cv2.imwrite(output_path, result)

    return {
        "success": True,
        "keypoints": len(keypoints),
        "matches": len(matches),
        "result_image": output_path
    }


if __name__ == "__main__":

    try:
        result = analyze_copy_move(sys.argv[1])
        print(json.dumps(result, indent=4))

    except Exception as error:
        print(json.dumps({
            "success": False,
            "error": str(error)
        }, indent=4))
        