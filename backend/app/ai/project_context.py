from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path

from app.ai.text_index import MarkdownChunk, score_tokens, sections, split_text, strip_frontmatter, title_from_note, tokens
from app.core.config import Settings


_INDEX_TTL_SECONDS = 20
_INDEX_CACHE: dict[tuple[str, str, int, int], tuple[float, tuple[tuple[str, float], ...], list[MarkdownChunk]]] = {}


@dataclass(frozen=True)
class ProjectContextChunk:
    title: str
    section: str | None
    content: str
    path: str
    score: float


class ProjectContextService:
    """Loads Obsidian notes as business/project context, not medical evidence."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def retrieve(self, *, question: str, top_k: int) -> list[ProjectContextChunk]:
        if not self.settings.obsidian_retrieval_enabled:
            return []

        query_tokens = tokens(question)
        if not query_tokens:
            return []

        scored = [
            (score_tokens(query_tokens, chunk.tokens, chunk.title, chunk.section), chunk)
            for chunk in self._load_chunks()
        ]
        scored = [(score, chunk) for score, chunk in scored if score > 0]
        scored.sort(key=lambda item: item[0], reverse=True)

        return [
            ProjectContextChunk(
                title=chunk.title,
                section=chunk.section,
                content=chunk.content,
                path=str(chunk.path),
                score=round(score, 4),
            )
            for score, chunk in scored[:top_k]
        ]

    def _load_chunks(self) -> list[MarkdownChunk]:
        key = (
            self.settings.obsidian_vault_path,
            self.settings.obsidian_memory_subdirs,
            self.settings.obsidian_max_files,
            self.settings.obsidian_chunk_chars,
        )
        files = self._markdown_files()
        signature = tuple((str(path), path.stat().st_mtime) for path in files if path.exists())
        cached = _INDEX_CACHE.get(key)
        if cached and cached[0] > time.time() and cached[1] == signature:
            return cached[2]

        chunks: list[MarkdownChunk] = []
        for path in files:
            text = path.read_text(encoding="utf-8", errors="ignore")
            chunks.extend(self._chunk_note(path, text))

        _INDEX_CACHE[key] = (time.time() + _INDEX_TTL_SECONDS, signature, chunks)
        return chunks

    def _markdown_files(self) -> list[Path]:
        files: list[Path] = []
        for root in self.settings.obsidian_memory_paths:
            if root.is_file() and root.suffix.lower() == ".md":
                files.append(root)
                continue
            if not root.exists():
                continue
            for path in root.rglob("*.md"):
                if ".obsidian" in path.parts or ".codex" in path.parts:
                    continue
                files.append(path)
                if len(files) >= self.settings.obsidian_max_files:
                    return sorted(files)
        return sorted(files)

    def _chunk_note(self, path: Path, text: str) -> list[MarkdownChunk]:
        clean = strip_frontmatter(text).strip()
        if not clean:
            return []

        note_title = title_from_note(path, clean)
        chunks: list[MarkdownChunk] = []
        for section, content in sections(clean):
            for piece in split_text(content, self.settings.obsidian_chunk_chars):
                chunk_tokens = frozenset(tokens(f"{note_title} {section or ''} {piece}"))
                if not chunk_tokens:
                    continue
                chunks.append(
                    MarkdownChunk(
                        path=path,
                        title=note_title,
                        section=section,
                        content=piece,
                        tokens=chunk_tokens,
                    )
                )
        return chunks
