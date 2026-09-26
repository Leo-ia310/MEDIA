from __future__ import annotations

import base64
import time
from dataclasses import dataclass

from app.core.config import Settings
from app.core.exceptions import ProviderError


@dataclass(frozen=True)
class GeneratedImage:
    mime_type: str
    data: str
    model: str
    latency_ms: int


class GeminiImageProvider:
    provider_name = "gemini"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def generate_image(self, *, prompt: str, quality: str = "fast", aspect_ratio: str = "1:1") -> GeneratedImage:
        if not self.settings.gemini_configured:
            raise ProviderError("Gemini is not configured")
        model = self.model_for_quality(quality)
        started = time.perf_counter()
        try:
            from google import genai
            from google.genai import types
        except Exception as exc:  # pragma: no cover - depends on optional package install
            raise ProviderError("google-genai is not installed") from exc

        client = genai.Client(api_key=self.settings.gemini_api_key)
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(aspect_ratio=aspect_ratio),
            ),
        )
        latency_ms = int((time.perf_counter() - started) * 1000)
        for candidate in response.candidates or []:
            content = getattr(candidate, "content", None)
            for part in getattr(content, "parts", []) or []:
                inline_data = getattr(part, "inline_data", None)
                if inline_data and getattr(inline_data, "data", None):
                    raw = inline_data.data
                    data = base64.b64encode(raw).decode("ascii") if isinstance(raw, bytes) else str(raw)
                    return GeneratedImage(
                        mime_type=getattr(inline_data, "mime_type", None) or "image/png",
                        data=data,
                        model=model,
                        latency_ms=latency_ms,
                    )
        raise ProviderError("Gemini returned no image")

    def model_for_quality(self, quality: str) -> str:
        return self.settings.gemini_image_quality_model if quality == "quality" else self.settings.gemini_image_model
