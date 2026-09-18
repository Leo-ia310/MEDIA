import time
from collections.abc import Sequence
from typing import Any

import httpx

from app.ai.providers.base import EmbeddingProvider, LLMProvider
from app.ai.schemas import LLMResponse, ModelSelection
from app.core.config import Settings
from app.core.exceptions import ModelUnavailableError, ProviderError


class CloudflareWorkersAIProvider(LLMProvider):
    provider_name = "cloudflare-workers-ai"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def generate(self, *, messages: Sequence[dict[str, str]], selection: ModelSelection) -> LLMResponse:
        if not self.settings.cloudflare_configured:
            raise ProviderError("Cloudflare Workers AI is not configured")

        url = self._model_url(selection.model_id)
        payload: dict[str, Any] = {
            "messages": list(messages),
            "max_tokens": selection.max_tokens,
            "temperature": selection.temperature,
        }
        started = time.perf_counter()
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            try:
                response = await client.post(url, headers=self._headers(), json=payload)
            except httpx.TimeoutException as exc:
                raise ProviderError("Cloudflare Workers AI request timed out") from exc
            except httpx.HTTPError as exc:
                raise ProviderError("Cloudflare Workers AI request failed") from exc

        latency_ms = int((time.perf_counter() - started) * 1000)
        if response.status_code in {404, 400}:
            raise ModelUnavailableError(f"Model unavailable or invalid: {selection.model_id}", response.status_code)
        if response.status_code in {401, 403}:
            raise ProviderError("Cloudflare authentication failed", response.status_code)
        if response.status_code == 429:
            raise ProviderError("Cloudflare rate limit or quota exceeded", response.status_code)
        if response.status_code >= 500:
            raise ProviderError("Cloudflare provider error", response.status_code)

        data = response.json()
        if not data.get("success", False):
            errors = data.get("errors") or []
            message = errors[0].get("message") if errors and isinstance(errors[0], dict) else "Cloudflare returned an unsuccessful response"
            raise ProviderError(message, response.status_code)

        result = data.get("result") or {}
        text = self._extract_text(result)
        if not text:
            raise ProviderError("Cloudflare returned an empty or unsupported response")
        return LLMResponse(
            text=text,
            model=selection.model_id,
            provider=self.provider_name,
            latency_ms=latency_ms,
            usage=result.get("usage") or data.get("usage") or {},
        )

    def _model_url(self, model_id: str) -> str:
        return f"https://api.cloudflare.com/client/v4/accounts/{self.settings.cloudflare_account_id}/ai/run/{model_id}"

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.settings.cloudflare_api_token}", "Content-Type": "application/json"}

    @staticmethod
    def _extract_text(result: dict[str, Any]) -> str:
        if isinstance(result.get("response"), str):
            return result["response"]
        if isinstance(result.get("text"), str):
            return result["text"]
        choices = result.get("choices")
        if isinstance(choices, list) and choices:
            message = choices[0].get("message") if isinstance(choices[0], dict) else None
            if isinstance(message, dict) and isinstance(message.get("content"), str):
                return message["content"]
        return ""


class CloudflareEmbeddingProvider(EmbeddingProvider):
    provider_name = "cloudflare-workers-ai"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def embed(self, texts: Sequence[str]) -> list[list[float]]:
        if not self.settings.cloudflare_configured:
            raise ProviderError("Cloudflare Workers AI is not configured")
        url = f"https://api.cloudflare.com/client/v4/accounts/{self.settings.cloudflare_account_id}/ai/run/{self.settings.ai_embedding_model}"
        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            response = await client.post(url, headers={"Authorization": f"Bearer {self.settings.cloudflare_api_token}"}, json={"text": list(texts)})
        if response.status_code >= 400:
            raise ProviderError("Cloudflare embedding request failed", response.status_code)
        data = response.json()
        result = data.get("result") or {}
        vectors = result.get("data") or result.get("embeddings") or []
        return vectors
