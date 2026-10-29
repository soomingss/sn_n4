"""Normalize catalog framing without stretching or changing material colors.

Offline tool: python + Pillow + numpy + scipy. Run from repository root.
Optional --overrides JSON maps old asset URLs to approved replacement files.
"""
import argparse
import io
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

SIZE = 960
SUBJECT_EDGE = 806  # 84% of the square, consistent 8% minimum margin.


def subject_bounds(image):
    sample = image.copy()
    sample.thumbnail((480, 480))
    rgb = np.asarray(sample.convert("RGB"), dtype=np.int16)
    # Exclude the near-white background and very faint contact shadows.
    mask = np.min(rgb, axis=2) < 235
    labels, count = ndimage.label(ndimage.binary_dilation(mask, iterations=2))
    sizes = np.bincount(labels.ravel())
    keep = np.flatnonzero(sizes >= max(12, mask.sum() * 0.0005))
    keep = keep[keep != 0]
    if not len(keep):
        raise ValueError("No reliable subject detected")
    clean = mask & np.isin(labels, keep)
    ys, xs = np.where(clean)
    sx, sy = image.width / sample.width, image.height / sample.height
    # Retain a small halo around the material so pale edges are not clipped.
    halo = max(image.size) * 0.012
    return (max(0, int(xs.min() * sx - halo)),
            max(0, int(ys.min() * sy - halo)),
            min(image.width, int((xs.max() + 1) * sx + halo)),
            min(image.height, int((ys.max() + 1) * sy + halo)))


def normalize(source, destination):
    image = Image.open(source).convert("RGB")
    bounds = subject_bounds(image)
    crop = image.crop(bounds)
    scale = SUBJECT_EDGE / max(crop.size)
    crop = crop.resize((round(crop.width * scale), round(crop.height * scale)),
                       Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (SIZE, SIZE), "white")
    canvas.paste(crop, ((SIZE - crop.width) // 2, (SIZE - crop.height) // 2))
    destination.parent.mkdir(parents=True, exist_ok=True)
    buffer = io.BytesIO()
    canvas.save(buffer, "WEBP", quality=90, method=4)
    destination.write_bytes(buffer.getvalue())
    return {"source": str(source), "bounds": bounds,
            "subjectSize": list(crop.size), "output": str(destination)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--overrides", type=Path)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()
    overrides = json.loads(args.overrides.read_text()) if args.overrides else {}
    map_path = Path("app/lib/product-photo-map.json")
    manifest_path = Path("scripts/product-photo-manifest.json")
    photo_map = json.loads(map_path.read_text())
    manifest = json.loads(manifest_path.read_text())
    replacements, report = {}, []
    for old in sorted(set(photo_map.values())):
        prefix = "/products" if old.startswith("/products/") else "/products-reference"
        new = prefix + "/uniform-20261029/" + Path(old).stem + ".webp"
        source = Path(overrides.get(old, "public" + old))
        report.append(normalize(source, Path("public" + new)))
        replacements[old] = new
    photo_map = {name: replacements[url] for name, url in photo_map.items()}
    for group in manifest["groups"]:
        old = group["assetPath"]
        group["assetPath"] = replacements[old]
        group["framing"] = "960px square; centered subject; 84% maximum edge; white background"
        if old in overrides:
            group["editorialNote"] = group.get("editorialNote", "") + " 둥글고 풍성한 더미 구도 보정."
        if group.get("originVariants"):
            group["originVariants"] = {k: replacements[v] for k, v in group["originVariants"].items()}
    manifest["updatedAt"] = "2026-10-29"
    map_path.write_text(json.dumps(photo_map, ensure_ascii=False, indent=2) + "\n")
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(f"Normalized {len(replacements)} unique photos, {len(photo_map)} mappings")


if __name__ == "__main__":
    main()