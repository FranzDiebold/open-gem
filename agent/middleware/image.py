import asyncio
import base64
import io
import re
from typing import Awaitable, Callable

from langchain.agents.middleware import AgentMiddleware, ModelRequest, ModelResponse
from PIL import Image

MAX_IMAGE_DIMENSION = 1280
JPEG_QUALITY = 85


def _resize_base64_image(data_url: str) -> str:
    """Resize a base64-encoded image if it exceeds MAX_IMAGE_DIMENSION."""
    match = re.match(r"data:image/(\w+);base64,(.*)", data_url, re.DOTALL)
    if not match:
        return data_url

    original_format = match.group(1).lower()
    image_data = base64.b64decode(match.group(2))

    img = Image.open(io.BytesIO(image_data))
    width, height = img.size

    if width <= MAX_IMAGE_DIMENSION and height <= MAX_IMAGE_DIMENSION:
        return data_url

    # Resize preserving aspect ratio
    img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.LANCZOS)

    # Re-encode
    buffer = io.BytesIO()
    if original_format in ("jpeg", "jpg") or img.mode == "RGB":
        output_format = "JPEG"
        mime = "image/jpeg"
        if img.mode == "RGBA":
            img = img.convert("RGB")
        img.save(buffer, format=output_format, quality=JPEG_QUALITY)
    else:
        output_format = "PNG"
        mime = "image/png"
        img.save(buffer, format=output_format)

    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:{mime};base64,{encoded}"


def _process_content_blocks(content) -> list:
    """Process content blocks and resize any images found."""
    if not isinstance(content, list):
        return content

    new_content = []
    for block in content:
        if isinstance(block, dict) and block.get("type") == "image_url":
            image_url = block.get("image_url", {})
            url = image_url.get("url", "")
            if url.startswith("data:image/"):
                resized_url = _resize_base64_image(url)
                new_content.append({
                    "type": "image_url",
                    "image_url": {"url": resized_url},
                })
            else:
                new_content.append(block)
        else:
            new_content.append(block)
    return new_content


def _resize_images_in_request(request: ModelRequest) -> ModelRequest:
    """Resize images in all messages of the request."""
    new_messages = []
    changed = False

    for msg in request.messages:
        if hasattr(msg, "content") and isinstance(msg.content, list):
            new_content = _process_content_blocks(msg.content)
            if new_content is not msg.content:
                msg = msg.model_copy(update={"content": new_content})
                changed = True
        new_messages.append(msg)

    if changed:
        return request.override(messages=new_messages)
    return request


class ImageResizeMiddleware(AgentMiddleware):
    """Middleware that resizes large images before sending to the model."""

    def wrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], ModelResponse],
    ) -> ModelResponse:
        return handler(_resize_images_in_request(request))

    async def awrap_model_call(
        self,
        request: ModelRequest,
        handler: Callable[[ModelRequest], Awaitable[ModelResponse]],
    ) -> ModelResponse:
        processed = await asyncio.to_thread(_resize_images_in_request, request)
        return await handler(processed)
