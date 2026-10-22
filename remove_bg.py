import os
from PIL import Image

def process():
    input_path = os.path.abspath("frontend/src/assets/hero-image2.jpg")
    output_src = os.path.abspath("frontend/src/assets/hero-image2-nobg.png")
    output_pub = os.path.abspath("frontend/public/hero-image2-nobg.png")

    print(f"Reading input image: {input_path}")
    input_img = Image.open(input_path).convert("RGB")
    print(f"Original size: {input_img.size}")

    from rembg import remove, new_session
    print("Running background removal with isnet-general-use...")
    session = new_session("isnet-general-use")
    nobg_img = remove(input_img, session=session)

    # Crop tightly to the alpha bounding box
    bbox = nobg_img.getbbox()
    print(f"Non-transparent bounding box: {bbox}")
    if bbox:
        # Add 4px margin if within boundaries
        w, h = nobg_img.size
        left = max(0, bbox[0] - 4)
        top = max(0, bbox[1] - 4)
        right = min(w, bbox[2] + 4)
        bottom = min(h, bbox[3] + 4)
        cropped_img = nobg_img.crop((left, top, right, bottom))
    else:
        cropped_img = nobg_img

    print(f"Final output size: {cropped_img.size}")
    cropped_img.save(output_src, format="PNG")
    cropped_img.save(output_pub, format="PNG")
    print(f"Saved cleanly to:\n  {output_src}\n  {output_pub}")

if __name__ == "__main__":
    process()
