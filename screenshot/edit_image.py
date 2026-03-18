#!/usr/bin/env python3
"""
Nano Banana Image Editor - 使用 Gemini 2.5 Flash Image API 編輯 App 截圖
Usage: python edit_image.py <input_image> <output_image> "<editing_instruction>"
"""
import sys
import os
from google import genai
from google.genai import types
from PIL import Image
import io


def edit_image(input_path: str, output_path: str, instruction: str):
    """Edit an image using Gemini 2.5 Flash (Nano Banana)."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not set")
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    # Read image
    img = Image.open(input_path)
    print(f"Input: {input_path} ({img.size[0]}x{img.size[1]})")
    print(f"Instruction: {instruction}")

    # Convert to bytes for API
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    img_bytes.seek(0)

    # Call Nano Banana Pro (Gemini image editing)
    model_name = os.environ.get("NANOBANANA_MODEL", "nano-banana-pro-preview")
    print(f"Model: {model_name}")
    response = client.models.generate_content(
        model=model_name,
        contents=[
            types.Content(
                parts=[
                    types.Part.from_bytes(
                        data=img_bytes.read(),
                        mime_type="image/png"
                    ),
                    types.Part.from_text(text=instruction),
                ]
            )
        ],
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
        ),
    )

    # Extract and save the edited image
    if response.candidates:
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                image_data = part.inline_data.data
                result_img = Image.open(io.BytesIO(image_data))
                result_img.save(output_path)
                print(f"SUCCESS: {output_path} ({result_img.size[0]}x{result_img.size[1]})")
                return True
            elif part.text:
                print(f"Model text: {part.text[:300]}")

    print("ERROR: No image in response.")
    return False


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python edit_image.py <input> <output> '<instruction>'")
        sys.exit(1)

    edit_image(sys.argv[1], sys.argv[2], sys.argv[3])
