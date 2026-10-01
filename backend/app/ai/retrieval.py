from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
import logging
import time
from uuid import uuid5, NAMESPACE_URL

from app.ai.schemas import EvidenceChunk
from app.ai.text_index import expand_medical_tokens, normalize, score_tokens, tokens
from app.core.config import Settings
from app.core.exceptions import ProviderError
from app.core.latency import current_metrics
from app.db.supabase import SupabaseRepository
from app.services.reference_ingestion import ReferenceDocument, ReferenceIngestionService


QUERY_STOPWORDS = {
    "que",
    "como",
    "cual",
    "cuales",
    "cuáles",
    "son",
    "las",
    "los",
    "una",
    "uno",
    "unos",
    "del",
    "con",
    "para",
    "hola",
    "dime",
    "explica",
    "what",
    "which",
    "the",
    "and",
    "about",
}

LOCAL_REFERENCE_MIN_SCORE = 2.0

logger = logging.getLogger("media.rag")
_LOCAL_DOCUMENT_CACHE: dict[tuple[str, str, int], list[ReferenceDocument]] = {}
_LOCAL_INDEX_CACHE: dict[tuple[str, str, int], list["LocalReferenceEntry"]] = {}


@dataclass(frozen=True)
class LocalReferenceEntry:
    document: ReferenceDocument
    document_id: str
    pdf_url: str | None
    chunk: object
    chunk_id: str
    search_text: str
    title_tokens: set[str]
    section_tokens: set[str]


class RetrievalService:
    """Retrieves vetted medical evidence from Supabase.

    Obsidian project notes are intentionally excluded from this service. Only
    Supabase medical chunks can become citations or move an answer to grounded.
    """

    def __init__(self, settings: Settings, repo: SupabaseRepository) -> None:
        self.settings = settings
        self.repo = repo
        self._local_documents: list[ReferenceDocument] | None = None
        self._local_index: list[LocalReferenceEntry] | None = None

    async def retrieve(self, *, question: str, token: str, top_k: int) -> list[EvidenceChunk]:
        metrics = RagMetrics()
        try:
            with metrics.measure("query_preprocessing"):
                query_tokens = expand_medical_tokens(tokens(question) - QUERY_STOPWORDS)
                metrics.set("query_token_count", len(query_tokens))
            if not query_tokens:
                metrics.set("final_chunks", 0)
                return []

            try:
                rows = await self._fetch_candidate_chunks(token=token, query_tokens=query_tokens, metrics=metrics)
            except ProviderError:
                metrics.set("supabase_failed", True)
                with metrics.measure("local_reference_fallback"):
                    evidence = self._retrieve_local_references(query_tokens=query_tokens, top_k=top_k, metrics=metrics)
                metrics.set("final_chunks", len(evidence))
                return evidence
            if not rows:
                with metrics.measure("local_reference_fallback"):
                    local_evidence = self._retrieve_local_references(query_tokens=query_tokens, top_k=top_k, metrics=metrics)
                if local_evidence:
                    metrics.set("final_chunks", len(local_evidence))
                    return local_evidence

            with metrics.measure("processing_results"):
                scored = []
                for row in rows:
                    content = row.get("content") or ""
                    document = _document(row)
                    title = document.get("title") or "Documento medico"
                    section = row.get("section") or row.get("subsection")
                    chunk_tokens = tokens(f"{title} {section or ''} {content}")
                    score = score_tokens(query_tokens, chunk_tokens, title, section)
                    if score > 0:
                        scored.append((score, row, document))
                metrics.set("scored_chunks", len(scored))

            with metrics.measure("reranking"):
                scored.sort(key=lambda item: item[0], reverse=True)

            with metrics.measure("build_evidence_chunks"):
                evidence = [
                    EvidenceChunk(
                        id=row["id"],
                        document_id=row["document_id"],
                        content=row["content"],
                        title=document.get("title") or "Documento medico",
                        section=row.get("section") or row.get("subsection"),
                        page_start=row.get("page_start"),
                        page_end=row.get("page_end"),
                        pdf_url=document.get("pdf_url"),
                        metadata={
                            "source": "supabase_medical",
                            "score": round(score, 4),
                            "chunk_index": row.get("chunk_index"),
                        },
                    )
                    for score, row, document in scored[:top_k]
                ]
                metrics.set("final_chunks", len(evidence))
            return evidence
        finally:
            metrics.log()

    def _retrieve_local_references(self, *, query_tokens: set[str], top_k: int, metrics: "RagMetrics | None" = None) -> list[EvidenceChunk]:
        scored = []
        with _rag_measure(metrics, "load_local_index"):
            index = self._load_local_index()
            if metrics:
                metrics.set("documents_consulted", len({entry.document_id for entry in index}))
        with _rag_measure(metrics, "local_reference_scoring"):
            for entry in index:
                score = _score_local_entry(query_tokens, entry)
                if score < LOCAL_REFERENCE_MIN_SCORE:
                    continue
                scored.append((score, entry))
            if metrics:
                metrics.set("candidate_chunks", len(scored))

        with _rag_measure(metrics, "reranking"):
            scored.sort(key=lambda item: item[0], reverse=True)
        with _rag_measure(metrics, "build_evidence_chunks"):
            return [
                EvidenceChunk(
                    id=entry.chunk_id,
                    document_id=entry.document_id,
                    content=entry.chunk.content,
                    title=entry.document.title,
                    section=entry.chunk.section or entry.chunk.subsection,
                    page_start=entry.chunk.page_start,
                    page_end=entry.chunk.page_end,
                    pdf_url=entry.pdf_url,
                    metadata={
                        "source": "local_reference_markdown",
                        "score": round(score, 4),
                        "chunk_index": entry.chunk.chunk_index,
                        "source_markdown": entry.document.markdown_path.name,
                    },
                )
                for score, entry in scored[:top_k]
            ]

    def _load_local_documents(self) -> list[ReferenceDocument]:
        cache_key = self._local_cache_key()
        if cache_key in _LOCAL_DOCUMENT_CACHE:
            self._local_documents = _LOCAL_DOCUMENT_CACHE[cache_key]
            return self._local_documents
        if self._local_documents is None:
            self._local_documents = ReferenceIngestionService(self.settings).discover()
            _LOCAL_DOCUMENT_CACHE[cache_key] = self._local_documents
        return self._local_documents

    def _load_local_index(self) -> list[LocalReferenceEntry]:
        cache_key = self._local_cache_key()
        if cache_key in _LOCAL_INDEX_CACHE:
            self._local_index = _LOCAL_INDEX_CACHE[cache_key]
            return self._local_index
        if self._local_index is not None:
            return self._local_index
        entries: list[LocalReferenceEntry] = []
        for document in self._load_local_documents():
            document_id = str(uuid5(NAMESPACE_URL, document.markdown_path.resolve().as_posix()))
            pdf_url = self._local_pdf_url(document)
            for chunk in document.chunks:
                entries.append(
                    LocalReferenceEntry(
                        document=document,
                        document_id=document_id,
                        pdf_url=pdf_url,
                        chunk=chunk,
                        chunk_id=str(uuid5(NAMESPACE_URL, f"{document.markdown_path.resolve().as_posix()}#{chunk.chunk_index}")),
                        search_text=normalize(f"{document.title} {chunk.section or ''} {chunk.subsection or ''} {chunk.content}"),
                        title_tokens=tokens(document.title),
                        section_tokens=tokens(f"{chunk.section or ''} {chunk.subsection or ''}"),
                    )
                )
        self._local_index = entries
        _LOCAL_INDEX_CACHE[cache_key] = entries
        return entries

    def _local_cache_key(self) -> tuple[str, str, int]:
        return (self.settings.references_dir, self.settings.reference_markdown_dir, self.settings.reference_chunk_chars)

    def _local_pdf_url(self, document: ReferenceDocument) -> str | None:
        if document.pdf_path is None:
            return None
        return ReferenceIngestionService(self.settings).pdf_url(document.pdf_path)

    async def _fetch_candidate_chunks(self, *, token: str, query_tokens: set[str], metrics: "RagMetrics | None" = None) -> list[dict]:
        base_params = {
            "select": "id,document_id,content,page_start,page_end,section,subsection,chunk_index,metadata,medical_documents!inner(id,title,pdf_url,verified,status)",
            "medical_documents.verified": "eq.true",
            "medical_documents.status": "neq.archived",
            "order": "chunk_index.asc",
            "limit": str(self.settings.medical_retrieval_candidate_limit),
        }
        with _rag_measure(metrics, "metadata_filter"):
            terms = _search_terms(query_tokens)
            if metrics:
                metrics.set("server_filter_terms", len(terms))
        if terms:
            filtered_params = dict(base_params)
            filtered_params["or"] = "(" + ",".join(
                filter_expr
                for term in terms
                for filter_expr in (
                    f"content.ilike.*{term}*",
                    f"section.ilike.*{term}*",
                    f"subsection.ilike.*{term}*",
                )
            ) + ")"
            rows = await self._supabase_request(token=token, params=filtered_params, metrics=metrics, label="filtered")
            if rows:
                if metrics:
                    metrics.set("candidate_chunks", len(rows))
                    metrics.set("documents_consulted", _document_count(rows))
                return rows

        rows = await self._supabase_request(token=token, params=base_params, metrics=metrics, label="base")
        if metrics:
            metrics.set("candidate_chunks", len(rows or []))
            metrics.set("documents_consulted", _document_count(rows or []))
        return rows or []

    async def _supabase_request(self, *, token: str, params: dict[str, str], metrics: "RagMetrics | None", label: str) -> list[dict] | None:
        if metrics:
            metrics.increment("supabase_queries")
            metrics.set("last_supabase_query_kind", label)
        with _rag_measure(metrics, "vector_db_query"):
            with _rag_measure(metrics, "fetch_chunks"):
                return await self.repo.request(
                    table="medical_chunks",
                    method="GET",
                    token=token,
                    params=params,
                )


def _document(row: dict) -> dict:
    value = row.get("medical_documents") or {}
    if isinstance(value, list):
        return value[0] if value else {}
    return value


def _document_count(rows: list[dict]) -> int:
    document_ids = {str(row.get("document_id")) for row in rows if row.get("document_id")}
    return len(document_ids)


def _score_local_entry(query_tokens: set[str], entry: LocalReferenceEntry) -> float:
    overlap = {token for token in query_tokens if token in entry.search_text}
    if not overlap:
        return 0
    score = float(len(overlap))
    score += len(overlap & entry.title_tokens) * 1.8
    score += len(overlap & entry.section_tokens) * 1.2
    score += len(overlap) / max(len(query_tokens), 1)
    return score


class RagMetrics:
    def __init__(self) -> None:
        self.started = time.perf_counter()
        self.durations_ms: dict[str, int] = {
            "embedding": 0,
            "embedding_provider_call": 0,
            "vector_db_query": 0,
            "metadata_filter": 0,
            "fetch_chunks": 0,
            "reranking": 0,
            "ai_calls_inside_rag": 0,
        }
        self.details: dict[str, object] = {
            "embedding_provider": None,
            "embedding_model": None,
            "reranking_provider": None,
            "reranking_model": None,
            "supabase_queries": 0,
            "retries": 0,
            "documents_consulted": 0,
            "candidate_chunks": 0,
            "final_chunks": 0,
        }

    @contextmanager
    def measure(self, name: str):
        started = time.perf_counter()
        try:
            yield
        finally:
            self.add_duration(name, int((time.perf_counter() - started) * 1000))

    def add_duration(self, name: str, duration_ms: int) -> None:
        self.durations_ms[name] = self.durations_ms.get(name, 0) + duration_ms

    def set(self, key: str, value: object) -> None:
        self.details[key] = value

    def increment(self, key: str, amount: int = 1) -> None:
        current = self.details.get(key, 0)
        self.details[key] = int(current) + amount if isinstance(current, int) else amount

    def snapshot(self) -> dict[str, object]:
        total = int((time.perf_counter() - self.started) * 1000)
        request_id = current_metrics().request_id if current_metrics() else None
        return {
            "request_id": request_id,
            **{f"{name}_ms": value for name, value in self.durations_ms.items()},
            "total_rag_ms": total,
            **self.details,
        }

    def log(self) -> None:
        snapshot = self.snapshot()
        request_id = current_metrics().request_id if current_metrics() else None
        if current_metrics():
            current_metrics().set_detail("rag_internal_metrics", snapshot)
        lines = [
            "[RAG_METRICS]",
            f"request_id: {request_id or 'n/a'}",
            f"embedding: {snapshot.get('embedding_ms', 0)} ms",
            f"embedding_provider_call: {snapshot.get('embedding_provider_call_ms', 0)} ms",
            f"vector_db_query: {snapshot.get('vector_db_query_ms', 0)} ms",
            f"metadata_filter: {snapshot.get('metadata_filter_ms', 0)} ms",
            f"fetch_chunks: {snapshot.get('fetch_chunks_ms', 0)} ms",
            f"processing_results: {snapshot.get('processing_results_ms', 0)} ms",
            f"reranking: {snapshot.get('reranking_ms', 0)} ms",
            f"local_reference_fallback: {snapshot.get('local_reference_fallback_ms', 0)} ms",
            f"load_local_index: {snapshot.get('load_local_index_ms', 0)} ms",
            f"ai_calls_inside_rag: {snapshot.get('ai_calls_inside_rag_ms', 0)} ms",
            f"TOTAL_RAG: {snapshot.get('total_rag_ms', 0)} ms",
            "",
            f"documents_consulted: {snapshot.get('documents_consulted', 0)}",
            f"candidate_chunks: {snapshot.get('candidate_chunks', 0)}",
            f"final_chunks: {snapshot.get('final_chunks', 0)}",
            f"supabase_queries: {snapshot.get('supabase_queries', 0)}",
            f"retries: {snapshot.get('retries', 0)}",
            f"embedding_provider: {snapshot.get('embedding_provider')}",
            f"embedding_model: {snapshot.get('embedding_model')}",
            f"reranking_provider: {snapshot.get('reranking_provider')}",
            f"reranking_model: {snapshot.get('reranking_model')}",
        ]
        logger.info("\n%s", "\n".join(lines))


@contextmanager
def _rag_measure(metrics: RagMetrics | None, name: str):
    if metrics is None:
        yield
        return
    with metrics.measure(name):
        yield


SERVER_FILTER_STOPWORDS = {
    "que",
    "como",
    "para",
    "con",
    "una",
    "unos",
    "las",
    "los",
    "del",
    "sobre",
    "explica",
    "dime",
    "cuales",
    "cuáles",
    "what",
    "which",
    "about",
    "explain",
}


def _search_terms(query_tokens: set[str]) -> list[str]:
    safe_terms = []
    for token in sorted(query_tokens, key=lambda item: (-len(item), item)):
        if len(token) < 4 or token in SERVER_FILTER_STOPWORDS:
            continue
        if not token.replace("-", "").replace("_", "").isalnum():
            continue
        safe_terms.append(token)
    return safe_terms[:8]
