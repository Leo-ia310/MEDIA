from __future__ import annotations

import time
from collections.abc import Sequence
from typing import Any

import httpx

from app.ai.providers.base import LLMProvider
from app.ai.schemas import LLMResponse, ModelSelection
from app.core.config import Settings
from app.core.exceptions import ModelUnavailableError, ProviderError


class GroqProvider(LLMProvider):
    provider_name = "groq"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    async def generate(self, *, messages: Sequence[dict[str, Any]], selection: ModelSelection) -> LLMResponse:
        if not self.settings.groq_configured:
            raise ProviderError("Groq is not configured")
        payload: dict[str, Any] = {
            "model": selection.model_id,
            "messages": list(messages),
            "temperature": selection.temperature,
            "max_tokens": selection.max_tokens,
            "reasoning_effort": selection.reasoning_effort,
        }
        started = time.perf_counter()
        async with httpx.AsyncClient(timeout=self.settings.groq_timeout_seconds) as client:
            data = await self._post(client, payload, selection.model_id)
        latency_ms = int((time.perf_counter() - started) * 1000)
        choices = data.get("choices") if isinstance(data, dict) else None
        text = ""
        if isinstance(choices, list) and choices:
            message = choices[0].get("message") if isinstance(choices[0], dict) else {}
            content = message.get("content") if isinstance(message, dict) else ""
            if isinstance(content, str):
                text = content.strip()
            elif isinstance(content, list):
                text = "\n".join(part.get("text", "") for part in content if isinstance(part, dict)).strip()
        if not text:
            raise ProviderError("Groq returned an empty response")
        return LLMResponse(
            text=text,
            model=selection.model_id,
            provider=self.provider_name,
            latency_ms=latency_ms,
            usage=data.get("usage") if isinstance(data, dict) else {},
        )

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.settings.groq_api_key}", "Content-Type": "application/json"}

    async def _post(self, client: httpx.AsyncClient, payload: dict[str, Any], model_id: str) -> dict[str, Any]:
        try:
            response = await client.post(self.base_url, headers=self._headers(), json=payload)
        except httpx.TimeoutException as exc:
            raise ProviderError("Groq request timed out") from exc
        except httpx.HTTPError as exc:
            raise ProviderError("Groq request failed") from exc

        if response.status_code in {401, 403}:
            raise ProviderError("Groq authentication failed", response.status_code)
        if response.status_code == 404:
            raise ModelUnavailableError(f"Groq model unavailable or invalid: {model_id}", response.status_code)
        if response.status_code == 429:
            raise ProviderError("Groq rate limit or quota exceeded", response.status_code)
        if response.status_code >= 500:
            raise ProviderError("Groq provider error", response.status_code)
        if response.status_code >= 400:
            raise ProviderError("Groq request was rejected", response.status_code)
        return response.json()
