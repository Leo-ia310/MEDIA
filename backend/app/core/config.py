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

    groq_api_key: str = ""
    groq_low_model: str = "openai/gpt-oss-20b"
    groq_medium_model: str = "qwen/qwen3.8-27b"
    groq_high_model: str = "openai/gpt-oss-120b"
    groq_vision_model: str = "qwen/qwen3.8-27b"
    groq_timeout_seconds: float = 35

    cloudflare_account_id: str = ""
    cloudflare_api_token: str = ""
    cloudflare_ai_model: str = ""

    ai_model_low: str = ""
    ai_model_medium: str = ""
    ai_model_high: str = ""
    ai_embedding_model: str = "@cf/qwen/qwen3-embedding-0.6b"
    ai_timeout_fallback_to_low: bool = True
    strict_document_grounding: bool = False

    allow_ai_calls: bool = True
    obsidian_retrieval_enabled: bool = True
    obsidian_vault_path: str = str(Path.home() / "Music" / "Maikel Main")
    obsidian_memory_subdirs: str = "proyectos/media"
    obsidian_max_files: int = 400
    obsidian_chunk_chars: int = 1800
    project_context_top_k: int = 3
    medical_retrieval_candidate_limit: int = 800
    references_dir: str = str(Path(__file__).resolve().parents[3] / "Referencias")
    reference_markdown_dir: str = str(Path(__file__).resolve().parents[3] / "Referencias" / "MDs")
    reference_chunk_chars: int = 1800
    backend_public_base_url: str = "http://127.0.0.1:8000"
    gemini_api_key: str = ""
    gemini_image_model: str = "gemini-3.1-flash-lite-image"
    gemini_image_quality_model: str = "gemini-3.1-flash-image"
    gemini_timeout_seconds: float = 60

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.backend_cors_origins.split(",") if item.strip()]

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_publishable_key)


    @property
    def groq_configured(self) -> bool:
        return bool(self.groq_api_key)


    @property
    def cloudflare_text_model(self) -> str:
        return self.cloudflare_ai_model or self.ai_model_low or "@cf/zai-org/glm-4.7-flash"

    @property
    def cloudflare_configured(self) -> bool:
        return bool(self.cloudflare_account_id and self.cloudflare_api_token)

    @property
    def gemini_configured(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def obsidian_memory_paths(self) -> list[Path]:
        vault = Path(self.obsidian_vault_path).expanduser()
        return [
            vault / Path(*item.strip().replace("\\", "/").split("/"))
            for item in self.obsidian_memory_subdirs.split(",")
            if item.strip()
        ]


Effort = Literal["low", "medium", "high"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
