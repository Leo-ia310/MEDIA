from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(Path(__file__).resolve().parents[3] / ".env", Path(__file__).resolve().parents[2] / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    log_level: str = "INFO"
    backend_cors_origins: str = (
        "http://localhost:8000,http://127.0.0.1:8000,"
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5500,http://127.0.0.1:5500"
    )
    request_timeout_seconds: float = 90

    supabase_url: str = ""
    supabase_publishable_key: str = ""
    supabase_secret_key: str = ""

    cloudflare_account_id: str = ""
    cloudflare_api_token: str = ""

    ai_model_low: str = "@cf/zai-org/glm-4.7-flash"
    ai_model_medium: str = "@cf/qwen/qwen3.8-27b"
    ai_model_high: str = "@cf/qwen/qwen3.8-27b"
    ai_embedding_model: str = "@cf/qwen/qwen3-embedding-0.6b"
    ai_timeout_fallback_to_low: bool = True
    strict_document_grounding: bool = False

    allow_ai_calls: bool = True

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.backend_cors_origins.split(",") if item.strip()]

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_publishable_key)

    @property
    def cloudflare_configured(self) -> bool:
        return bool(self.cloudflare_account_id and self.cloudflare_api_token)


Effort = Literal["low", "medium", "high"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
