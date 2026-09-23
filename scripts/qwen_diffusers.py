#!/usr/bin/env python3
"""Small stdin/stdout bridge for local Qwen Image Diffusers inference."""
import base64
import io
import json
import os
import sys

import torch
from PIL import Image
from diffusers import QwenImageEditPipeline, QwenImagePipeline


def main():
    request = json.load(sys.stdin)
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    dtype = torch.float16 if device == "mps" else torch.float32
    model = request.get("model", "Qwen/Qwen-Image")
    editing = request.get("operation") == "edit"
    pipeline_type = QwenImageEditPipeline if editing else QwenImagePipeline
    pipe = pipeline_type.from_pretrained(model, torch_dtype=dtype).to(device)
    kwargs = {
        "prompt": request["prompt"],
        "negative_prompt": request.get("negativePrompt", " "),
        "width": request.get("size", {}).get("width", 1024),
        "height": request.get("size", {}).get("height", 1024),
        "num_images_per_prompt": request.get("count", 1),
    }
    if request.get("seed") is not None:
        kwargs["generator"] = torch.Generator(device=device).manual_seed(request["seed"])
    if editing:
        kwargs["image"] = [Image.open(io.BytesIO(base64.b64decode(item["data"]))).convert("RGB") for item in request.get("images", [])]
    result = pipe(**kwargs)
    encoded = []
    for image in result.images:
        output = io.BytesIO()
        image.save(output, format="PNG")
        encoded.append({"data": base64.b64encode(output.getvalue()).decode("ascii"), "mimeType": "image/png"})
    print(json.dumps(encoded))


if __name__ == "__main__":
    main()
