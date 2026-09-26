import pytest

from app.ai.project_context import ProjectContextService
from app.core.config import Settings


@pytest.mark.asyncio
async def test_project_context_returns_matching_obsidian_note(tmp_path) -> None:
    note_dir = tmp_path / "proyectos" / "media"
    note_dir.mkdir(parents=True)
    note = note_dir / "arquitectura.md"
    note.write_text(
        """---
type: documentacion
---

# Arquitectura de Media

## Memoria de negocio

Obsidian guarda contexto del proyecto, decisiones, roadmap y pendientes. La base de datos real vive en Supabase.
""",
        encoding="utf-8",
    )
    settings = Settings(
        obsidian_vault_path=str(tmp_path),
        obsidian_memory_subdirs="proyectos/media",
        obsidian_chunk_chars=500,
    )

    chunks = await ProjectContextService(settings).retrieve(
        question="donde vive la base de datos de media",
        top_k=3,
    )

    assert chunks
    assert chunks[0].title == "Arquitectura de Media"
    assert chunks[0].section == "Memoria de negocio"
    assert "Supabase" in chunks[0].content


@pytest.mark.asyncio
async def test_project_context_returns_empty_when_disabled(tmp_path) -> None:
    settings = Settings(
        obsidian_retrieval_enabled=False,
        obsidian_vault_path=str(tmp_path),
    )

    chunks = await ProjectContextService(settings).retrieve(
        question="base de datos",
        top_k=3,
    )

    assert chunks == []
