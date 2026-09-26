from __future__ import annotations

import argparse
import asyncio
import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote

import httpx
from dotenv import load_dotenv

from app.core.config import Settings, get_settings
from app.ai.text_index import HEADING_RE, strip_frontmatter, title_from_note

PAGE_RE = re.compile(r"<!--\s*PDF_PAGE:\s*(\d+)\s*-->")
FRONTMATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*", re.DOTALL)


@dataclass(frozen=True)
class ReferenceChunk:
    content: str
    section: str | None
    subsection: str | None
    page_start: int | None
    page_end: int | None
    chunk_index: int
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ReferenceDocument:
    markdown_path: Path
    pdf_path: Path | None
    metadata: dict[str, Any]
    title: str
    chunks: list[ReferenceChunk]

    @property
    def source_file(self) -> str | None:
        value = self.metadata.get("source_file")
        return str(value) if value else None


@dataclass(frozen=True)
class IngestionResult:
    markdown_files: int
    documents: int
    chunks: int
    missing_pdfs: list[str]
    dry_run: bool


class ReferenceIngestionService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.references_dir = Path(settings.references_dir).expanduser().resolve()
        self.markdown_dir = Path(settings.reference_markdown_dir).expanduser().resolve()
        self.chunk_chars = settings.reference_chunk_chars

    def discover(self) -> list[ReferenceDocument]:
        documents: list[ReferenceDocument] = []
        for markdown_path in sorted(self.markdown_dir.glob("*.md")):
            text = markdown_path.read_text(encoding="utf-8")
            metadata = parse_frontmatter(text)
            body = strip_frontmatter(text).strip()
            title = str(metadata.get("title") or title_from_note(markdown_path, body)).strip()
            pdf_path = self._resolve_pdf(metadata)
            chunks = chunk_markdown(body, chunk_chars=self.chunk_chars, markdown_path=markdown_path)
            documents.append(
                ReferenceDocument(
                    markdown_path=markdown_path,
                    pdf_path=pdf_path,
                    metadata=metadata,
                    title=title,
                    chunks=chunks,
                )
            )
        return documents

    def document_payload(self, document: ReferenceDocument) -> dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        source_file = document.source_file or (document.pdf_path.name if document.pdf_path else None)
        metadata = dict(document.metadata)
        metadata.update(
            {
                "source_markdown": relative_to_repo(document.markdown_path),
                "source_pdf": source_file,
                "ingested_at": now,
                "ingestion_profile": "local_markdown_pdf_reference_v1",
            }
        )
        return {
            "title": document.title,
            "authors": list_value(document.metadata.get("authors")),
            "organization": text_value(document.metadata.get("organization")),
            "specialty": text_value(document.metadata.get("specialty") or document.metadata.get("specialties")),
            "publication_date": date_value(document.metadata.get("publication_date") or document.metadata.get("publication_year") or document.metadata.get("original_publication_year")),
            "version": text_value(document.metadata.get("version") or document.metadata.get("edition") or document.metadata.get("series")),
            "source_url": text_value(document.metadata.get("source_url")),
            "pdf_url": self.pdf_url(document.pdf_path) if document.pdf_path else None,
            "pdf_path": relative_to_repo(document.pdf_path) if document.pdf_path else None,
            "verified": True,
            "status": "current",
            "metadata": metadata,
        }

    def chunk_payloads(self, document_id: str, document: ReferenceDocument) -> list[dict[str, Any]]:
        source_markdown = relative_to_repo(document.markdown_path)
        return [
            {
                "document_id": document_id,
                "content": chunk.content,
                "page_start": chunk.page_start,
                "page_end": chunk.page_end,
                "section": chunk.section,
                "subsection": chunk.subsection,
                "chunk_index": chunk.chunk_index,
                "metadata": {
                    **chunk.metadata,
                    "source": "local_reference_markdown",
                    "source_markdown": source_markdown,
                },
            }
            for chunk in document.chunks
        ]

    def pdf_url(self, pdf_path: Path) -> str:
        base_url = self.settings.backend_public_base_url.rstrip("/")
        relative = pdf_path.resolve().relative_to(self.references_dir).as_posix()
        return f"{base_url}/references/{quote(relative)}"

    def _resolve_pdf(self, metadata: dict[str, Any]) -> Path | None:
        source_file = metadata.get("source_file")
        if source_file:
            candidate = self.references_dir / str(source_file)
            if candidate.exists():
                return candidate.resolve()
        return None


class SupabaseReferenceWriter:
    def __init__(self, settings: Settings) -> None:
        if not settings.supabase_url or not settings.supabase_secret_key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SECRET_KEY are required for reference ingestion")
        self.settings = settings
        self.base_url = settings.supabase_url.rstrip("/")
        self.headers = {
            "apikey": settings.supabase_secret_key,
            "Authorization": f"Bearer {settings.supabase_secret_key}",
            "Content-Type": "application/json",
        }

    async def ingest(self, documents: list[ReferenceDocument], service: ReferenceIngestionService, *, dry_run: bool = False) -> IngestionResult:
        missing_pdfs = [relative_to_repo(doc.markdown_path) for doc in documents if doc.pdf_path is None]
        if dry_run:
            return IngestionResult(
                markdown_files=len(documents),
                documents=len(documents),
                chunks=sum(len(doc.chunks) for doc in documents),
                missing_pdfs=missing_pdfs,
                dry_run=True,
            )

        async with httpx.AsyncClient(timeout=self.settings.request_timeout_seconds) as client:
            chunk_count = 0
            for document in documents:
                document_id = await self._upsert_document(client, service.document_payload(document))
                await self._delete_chunks(client, document_id)
                chunks = service.chunk_payloads(document_id, document)
                for start in range(0, len(chunks), 100):
                    await self._insert_chunks(client, chunks[start : start + 100])
                chunk_count += len(chunks)

        return IngestionResult(
            markdown_files=len(documents),
            documents=len(documents),
            chunks=chunk_count,
            missing_pdfs=missing_pdfs,
            dry_run=False,
        )

    async def _upsert_document(self, client: httpx.AsyncClient, payload: dict[str, Any]) -> str:
        existing = await self._find_document(client, payload)
        if existing:
            document_id = existing["id"]
            response = await client.patch(
                f"{self.base_url}/rest/v1/medical_documents",
                headers={**self.headers, "Prefer": "return=representation"},
                params={"id": f"eq.{document_id}", "select": "id"},
                json=payload,
            )
        else:
            response = await client.post(
                f"{self.base_url}/rest/v1/medical_documents",
                headers={**self.headers, "Prefer": "return=representation"},
                params={"select": "id"},
                json=payload,
            )
        raise_for_supabase(response, "upsert medical document")
        data = response.json()
        if isinstance(data, list) and data:
            return data[0]["id"]
        if isinstance(data, dict) and data.get("id"):
            return data["id"]
        raise RuntimeError("Supabase did not return a document id")

    async def _find_document(self, client: httpx.AsyncClient, payload: dict[str, Any]) -> dict[str, Any] | None:
        pdf_path = payload.get("pdf_path")
        source_url = payload.get("source_url")
        params = {"select": "id,title,pdf_path,source_url", "limit": "1"}
        if pdf_path:
            params["pdf_path"] = f"eq.{pdf_path}"
        elif source_url:
            params["source_url"] = f"eq.{source_url}"
        else:
            params["title"] = f"eq.{payload['title']}"
        response = await client.get(f"{self.base_url}/rest/v1/medical_documents", headers=self.headers, params=params)
        raise_for_supabase(response, "find existing medical document")
        data = response.json()
        return data[0] if data else None

    async def _delete_chunks(self, client: httpx.AsyncClient, document_id: str) -> None:
        response = await client.delete(
            f"{self.base_url}/rest/v1/medical_chunks",
            headers=self.headers,
            params={"document_id": f"eq.{document_id}"},
        )
        raise_for_supabase(response, "delete existing medical chunks")

    async def _insert_chunks(self, client: httpx.AsyncClient, chunks: list[dict[str, Any]]) -> None:
        if not chunks:
            return
        response = await client.post(
            f"{self.base_url}/rest/v1/medical_chunks",
            headers={**self.headers, "Prefer": "return=minimal"},
            json=chunks,
        )
        raise_for_supabase(response, "insert medical chunks")


def parse_frontmatter(text: str) -> dict[str, Any]:
    match = FRONTMATTER_RE.match(text)
    if not match:
        return {}
    metadata: dict[str, Any] = {}
    current_key: str | None = None
    for raw_line in match.group(1).splitlines():
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue
        if raw_line.startswith("  -") and current_key:
            metadata.setdefault(current_key, [])
            value = parse_scalar(raw_line.split("-", 1)[1].strip())
            if isinstance(metadata[current_key], list):
                metadata[current_key].append(value)
            continue
        if ":" in raw_line and not raw_line.startswith(" "):
            key, raw_value = raw_line.split(":", 1)
            key = key.strip()
            raw_value = raw_value.strip()
            current_key = key
            metadata[key] = parse_scalar(raw_value) if raw_value else []
    return metadata


def parse_scalar(value: str) -> Any:
    value = value.strip()
    if not value:
        return ""
    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
        return value[1:-1]
    if value.lower() == "true":
        return True
    if value.lower() == "false":
        return False
    if re.fullmatch(r"\d+", value):
        return int(value)
    return value


def chunk_markdown(body: str, *, chunk_chars: int, markdown_path: Path) -> list[ReferenceChunk]:
    chunks: list[ReferenceChunk] = []
    current_lines: list[str] = []
    current_pages: list[int] = []
    current_section: str | None = None
    current_subsection: str | None = None
    active_page: int | None = None
    chunk_index = 0

    def flush() -> None:
        nonlocal current_lines, current_pages, chunk_index
        content = "\n".join(current_lines).strip()
        if len(content) < 80:
            current_lines = []
            current_pages = []
            return
        chunk_index += 1
        chunks.append(
            ReferenceChunk(
                content=content,
                section=current_section,
                subsection=current_subsection,
                page_start=min(current_pages) if current_pages else None,
                page_end=max(current_pages) if current_pages else None,
                chunk_index=chunk_index,
                metadata={"markdown_file": markdown_path.name},
            )
        )
        current_lines = []
        current_pages = []

    for raw_line in body.splitlines():
        page_match = PAGE_RE.search(raw_line)
        if page_match:
            active_page = int(page_match.group(1))
            continue

        heading_match = HEADING_RE.match(raw_line)
        if heading_match:
            flush()
            level = len(heading_match.group(1))
            heading = heading_match.group(2).strip()
            if level <= 2:
                current_section = heading
                current_subsection = None
            else:
                current_subsection = heading
            current_lines.append(raw_line.strip())
        else:
            current_lines.append(raw_line.rstrip())

        if active_page is not None and raw_line.strip():
            current_pages.append(active_page)
        if sum(len(line) + 1 for line in current_lines) >= chunk_chars:
            flush()

    flush()
    return chunks


def list_value(value: Any) -> list[str] | None:
    if value is None or value == "":
        return None
    if isinstance(value, list):
        return [str(item) for item in value]
    return [str(value)]


def text_value(value: Any) -> str | None:
    if value is None or value == "":
        return None
    if isinstance(value, list):
        return ", ".join(str(item) for item in value)
    return str(value)


def date_value(value: Any) -> str | None:
    if value is None or value == "":
        return None
    text = str(value)
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
        return text
    if re.fullmatch(r"\d{4}-\d{2}", text):
        return f"{text}-01"
    if re.fullmatch(r"\d{4}", text):
        return f"{text}-01-01"
    return None


def relative_to_repo(path: Path | None) -> str | None:
    if path is None:
        return None
    resolved = path.resolve()
    repo_root = Path(__file__).resolve().parents[3]
    try:
        return resolved.relative_to(repo_root).as_posix()
    except ValueError:
        return resolved.as_posix()


def raise_for_supabase(response: httpx.Response, action: str) -> None:
    if response.status_code < 400:
        return
    detail = response.text[:600]
    raise RuntimeError(f"Supabase failed to {action}: HTTP {response.status_code} {detail}")


async def run_ingestion(*, dry_run: bool) -> IngestionResult:
    repo_root = Path(__file__).resolve().parents[2]
    load_dotenv(repo_root / ".env")
    load_dotenv(repo_root.parent / ".env")
    get_settings.cache_clear()
    settings = get_settings()
    service = ReferenceIngestionService(settings)
    documents = service.discover()
    writer = SupabaseReferenceWriter(settings)
    return await writer.ingest(documents, service, dry_run=dry_run)


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest local medical Markdown/PDF references into Supabase.")
    parser.add_argument("--dry-run", action="store_true", help="Count documents and chunks without writing to Supabase.")
    parser.add_argument("--apply", action="store_true", help="Write/update documents and chunks in Supabase.")
    args = parser.parse_args()
    if not args.dry_run and not args.apply:
        parser.error("Use --dry-run to inspect or --apply to write to Supabase.")
    result = asyncio.run(run_ingestion(dry_run=args.dry_run))
    print(json.dumps(result.__dict__, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
