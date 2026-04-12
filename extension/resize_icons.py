from PIL import Image
import os

sizes = [16, 32, 48, 128]
input_path = "icons/icon-original.png"

try:
    with Image.open(input_path) as img:
        # Convert to RGBA to ensure it has an alpha channel if needed
        img = img.convert("RGBA")
        for size in sizes:
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            output_path = f"icons/icon{size}.png"
            resized.save(output_path, "PNG")
            print(f"Saved {output_path}")
except Exception as e:
    print(f"Error: {e}")
