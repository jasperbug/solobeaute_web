#!/usr/bin/env python3
"""
Smart Image Editor - 裁切局部 → Nano Banana 修圖 → 合成回原圖
保持原始解析度，只修改需要的區域

Usage: python smart_edit.py <input> <output> <crop_box> "<instruction>"
  crop_box format: x1,y1,x2,y2 (pixels from original image)

Example:
  python smart_edit.py IMG_2457.PNG edited/IMG_2457.PNG "400,900,900,1100" "Replace text"
"""
import sys
import os
from google import genai
from google.genai import types
from PIL import Image
import io


def smart_edit(input_path: str, output_path: str, crop_box: tuple, instruction: str):
    """Crop a region, edit with Nano Banana, composite back at original resolution."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not set")
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    # Load original image
    original = Image.open(input_path)
    orig_w, orig_h = original.size
    print(f"Original: {input_path} ({orig_w}x{orig_h})")

    # Crop the target region (with some padding for context)
    x1, y1, x2, y2 = crop_box
    # Add padding (10% of crop size)
    pad_x = int((x2 - x1) * 0.1)
    pad_y = int((y2 - y1) * 0.1)
    cx1 = max(0, x1 - pad_x)
    cy1 = max(0, y1 - pad_y)
    cx2 = min(orig_w, x2 + pad_x)
    cy2 = min(orig_h, y2 + pad_y)

    cropped = original.crop((cx1, cy1, cx2, cy2))
    crop_w, crop_h = cropped.size
    print(f"Crop region: ({cx1},{cy1})-({cx2},{cy2}) = {crop_w}x{crop_h}")

    # Convert crop to bytes
    crop_bytes = io.BytesIO()
    cropped.save(crop_bytes, format="PNG")
    crop_bytes.seek(0)

    # Edit with Nano Banana
    model_name = os.environ.get("NANOBANANA_MODEL", "nano-banana-pro-preview")
    print(f"Model: {model_name}")
    print(f"Instruction: {instruction}")

    response = client.models.generate_content(
        model=model_name,
        contents=[
            types.Content(
                parts=[
                    types.Part.from_bytes(
                        data=crop_bytes.read(),
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

    # Extract edited region
    edited_crop = None
    if response.candidates:
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                image_data = part.inline_data.data
                edited_crop = Image.open(io.BytesIO(image_data))
                print(f"Edited crop: {edited_crop.size[0]}x{edited_crop.size[1]}")
                break
            elif part.text:
                print(f"Model text: {part.text[:200]}")

    if edited_crop is None:
        print("ERROR: No image in response")
        return False

    # Resize edited crop back to original crop dimensions
    edited_crop_resized = edited_crop.resize((crop_w, crop_h), Image.LANCZOS)
    print(f"Resized back to: {crop_w}x{crop_h}")

    # Composite: paste edited region onto original
    result = original.copy()
    result.paste(edited_crop_resized, (cx1, cy1))

    # Save
    result.save(output_path, "PNG")
    print(f"SUCCESS: {output_path} ({result.size[0]}x{result.size[1]})")
    return True


def parse_crop_box(s: str) -> tuple:
    """Parse 'x1,y1,x2,y2' string to tuple of ints."""
    parts = s.split(",")
    if len(parts) != 4:
        raise ValueError(f"Expected x1,y1,x2,y2 but got: {s}")
    return tuple(int(p.strip()) for p in parts)


if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python smart_edit.py <input> <output> <x1,y1,x2,y2> '<instruction>'")
        print("  crop_box: pixel coordinates of region to edit")
        sys.exit(1)

    crop_box = parse_crop_box(sys.argv[3])
    smart_edit(sys.argv[1], sys.argv[2], crop_box, sys.argv[4])
