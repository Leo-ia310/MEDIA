from __future__ import annotations

from contextlib import contextmanager
from contextvars import ContextVar
import json
import logging
import time
from typing import Any
from uuid import uuid4


logger = logging.getLogger("media.latency")

_CURRENT_METRICS: ContextVar["MediaLatencyMetrics | None"] = ContextVar("media_latency_metrics", default=None)


class MediaLatencyMetrics:
    def __init__(self, request_id: str | None = None) -> None:
        self.request_id = request_id or uuid4().hex
        self.started = time.perf_counter()
        self.durations_ms: dict[str, int] = {}
        self.details: dict[str, Any] = {}
        self.retries: list[dict[str, Any]] = []

    @contextmanager
    def measure(self, name: str):
        started = time.perf_counter()
        try:
            yield
        finally:
            self.add_duration(name, int((time.perf_counter() - started) * 1000))

    def add_duration(self, name: str, duration_ms: int) -> None:
        self.durations_ms[name] = self.durations_ms.get(name, 0) + duration_ms

    def set_detail(self, key: str, value: Any) -> None:
        self.details[key] = _safe_value(value)

    def update_details(self, values: dict[str, Any]) -> None:
        for key, value in values.items():
            self.set_detail(key, value)

    def add_retry(self, *, retry_number: int, retry_reason: str, retry_delay_ms: int = 0, provider: str | None = None) -> None:
        retry = {
            "retry_number": retry_number,
            "retry_reason": retry_reason,
            "retry_delay_ms": retry_delay_ms,
        }
        if provider:
            retry["provider"] = provider
        self.retries.append(retry)

    def finish(self) -> None:
        self.durations_ms["TOTAL_REQUEST"] = int((time.perf_counter() - self.started) * 1000)

    def log(self) -> None:
        self.finish()
        logger.info("\n%s", self.text_report())
        logger.info("[MEDIA_METRICS] %s", self.json_line())

    def text_report(self) -> str:
        lines = [
            "============================================================",
            "[MEDIA LATENCY]",
            f"request_id: {self.request_id}",
            "",
        ]
        for name in _REPORT_STAGES:
            if name in self.durations_ms:
                lines.append(f"{name + ':':<28}{self.durations_ms[name]:>8} ms")
            else:
                lines.append(f"{name + ':':<28}{'n/a':>8}")
        lines.extend(
            [
                "",
                "------------------------------------------",
                f"{'TOTAL_BACKEND:':<28}{self.durations_ms.get('TOTAL_REQUEST', 0):>8} ms",
                "",
            ]
        )
        for label, key in _REPORT_DETAILS:
            value = self.details.get(key)
            if value is not None:
                lines.append(f"{label + ':':<28}{value}")
        if self.retries:
            lines.append(f"{'RETRIES_DETAIL:':<28}{json.dumps(self.retries, ensure_ascii=False, separators=(',', ':'))}")
        lines.append("============================================================")
        return "\n".join(lines)

    def json_line(self) -> str:
        return json.dumps(self.snapshot(), ensure_ascii=False, separators=(",", ":"), sort_keys=True)

    def snapshot(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "request_id": self.request_id,
            "total_ms": self.durations_ms.get("TOTAL_REQUEST"),
            "retries": len(self.retries),
        }
        for name, duration in self.durations_ms.items():
            payload[f"{name.lower()}_ms"] = duration
        payload.update(self.details)
        if self.retries:
            payload["retry_details"] = self.retries
        return payload


def set_current_metrics(metrics: MediaLatencyMetrics | None):
    return _CURRENT_METRICS.set(metrics)


def reset_current_metrics(token) -> None:
    _CURRENT_METRICS.reset(token)


def current_metrics() -> MediaLatencyMetrics | None:
    return _CURRENT_METRICS.get()


@contextmanager
def measure_latency(name: str):
    metrics = current_metrics()
    if metrics is None:
        yield
        return
    with metrics.measure(name):
        yield


def _safe_value(value: Any) -> Any:
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    if isinstance(value, dict):
        return {str(key): _safe_value(item) for key, item in value.items() if _is_safe_key(str(key))}
    if isinstance(value, (list, tuple)):
        return [_safe_value(item) for item in value]
    return str(value)


def _is_safe_key(key: str) -> bool:
    lowered = key.lower()
    blocked = ("key", "token", "password", "authorization", "content", "prompt", "message", "answer")
    return not any(item in lowered for item in blocked)


_REPORT_STAGES = (
    "AUTH",
    "LOAD_CONVERSATION",
    "CHAT_PARALLEL_LOAD",
    "SAVE_USER_MESSAGE",
    "LOAD_RECENT_MESSAGES",
    "LOAD_USER_MEMORY",
    "QUERY_PREPROCESSING_INTENT",
    "EMBEDDING",
    "RAG_VECTOR_SEARCH",
    "RERANKING",
    "LOAD_PROJECT_CONTEXT",
    "BUILD_PROMPT",
    "GROQ_REQUEST",
    "GROQ_TIME_TO_FIRST_TOKEN",
    "GROQ_GENERATION",
    "CLOUDFLARE_FALLBACK",
    "VERIFICATION_CRITIC",
    "SAVE_MESSAGE",
    "UPDATE_MEMORY_LEARNING_EVENT",
    "TOUCH_CONVERSATION_ON_ERROR",
)

_REPORT_DETAILS = (
    ("MODEL", "model"),
    ("PROVIDER", "provider"),
    ("FINAL_PROVIDER", "final_provider"),
    ("INPUT_TOKENS", "input_tokens"),
    ("OUTPUT_TOKENS", "output_tokens"),
    ("TOTAL_TOKENS", "total_tokens"),
    ("CACHED_TOKENS", "cached_tokens"),
    ("REASONING_TOKENS", "reasoning_tokens"),
    ("GROQ_QUEUE_TIME", "groq_queue_time"),
    ("GROQ_PROMPT_TIME", "groq_prompt_time"),
    ("GROQ_COMPLETION_TIME", "groq_completion_time"),
    ("GROQ_TOTAL_TIME", "groq_total_time"),
    ("RETRIES", "retries"),
    ("FALLBACK", "fallback"),
    ("FALLBACK_REASON", "fallback_reason"),
    ("MESSAGE_COUNT", "message_count"),
    ("RAG_CHUNKS", "rag_chunks"),
    ("PROJECT_CONTEXT_CHUNKS", "project_context_chunks"),
    ("PROMPT_CONTEXT_CHARS", "prompt_context_chars"),
)
