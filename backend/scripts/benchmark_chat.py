from __future__ import annotations

import argparse
import asyncio
import json
import os
import statistics
import time
from typing import Any

import httpx


DEFAULT_PROMPTS = [
    "¿Qué son las arterias?",
    "Explícame la fisiopatología de la cetoacidosis diabética.",
    "Según fuentes médicas, resume el manejo inicial de hipertensión arterial en atención primaria.",
    "Adapta la explicación a mi memoria previa y dime cómo estudiar farmacología cardiovascular.",
    "¿Cuál es el protocolo exacto de MEDIA para una enfermedad que no está en sus fuentes?",
    "Paciente con diabetes tipo 2, ERC y proteinuria: explica razonamiento clínico, riesgos y monitoreo.",
]


async def run_case(client: httpx.AsyncClient, *, prompt: str, effort: str, conversation_id: str | None) -> dict[str, Any]:
    started = time.perf_counter()
    response = await client.post(
        "/api/chat",
        json={
            "message": prompt,
            "conversation_id": conversation_id,
            "effort": effort,
            "attachments": [],
        },
    )
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    payload = response.json() if response.content else {}
    metrics = (payload.get("metadata") or {}).get("media_latency") or {}
    return {
        "status_code": response.status_code,
        "prompt": prompt,
        "elapsed_ms": elapsed_ms,
        "conversation_id": payload.get("conversation_id") or conversation_id,
        "total_ms": metrics.get("total_ms"),
        "ttft_ms": metrics.get("groq_time_to_first_token_ms"),
        "rag_ms": metrics.get("rag_vector_search_ms"),
        "db_parallel_ms": metrics.get("chat_parallel_load_ms"),
        "groq_ms": metrics.get("groq_request_ms"),
        "input_tokens": metrics.get("input_tokens"),
        "output_tokens": metrics.get("output_tokens"),
        "fallback": metrics.get("fallback"),
        "retries": metrics.get("retries"),
        "rag_internal": metrics.get("rag_internal_metrics"),
    }


def percentile(values: list[int], pct: float) -> int | None:
    if not values:
        return None
    if len(values) == 1:
        return values[0]
    ordered = sorted(values)
    index = round((len(ordered) - 1) * pct)
    return ordered[index]


def summarize(results: list[dict[str, Any]]) -> dict[str, Any]:
    totals = [int(item["total_ms"] or item["elapsed_ms"]) for item in results if item.get("status_code") < 500]
    return {
        "runs": len(results),
        "successes": sum(1 for item in results if item.get("status_code") < 500),
        "failures": sum(1 for item in results if item.get("status_code") >= 500),
        "total_p50_ms": int(statistics.median(totals)) if totals else None,
        "total_p95_ms": percentile(totals, 0.95),
        "results": results,
    }


async def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark real MEDIA /api/chat latency.")
    parser.add_argument("--base-url", default=os.getenv("MEDIA_API_BASE_URL", "http://127.0.0.1:8000"))
    parser.add_argument("--token", default=os.getenv("MEDIA_AUTH_TOKEN"))
    parser.add_argument("--repeat", type=int, default=1)
    parser.add_argument("--effort", default="medium", choices=["low", "medium", "high"])
    args = parser.parse_args()
    if not args.token:
        raise SystemExit("Set MEDIA_AUTH_TOKEN or pass --token. Do not commit real tokens.")

    headers = {"Authorization": f"Bearer {args.token}"}
    timeout = httpx.Timeout(120.0)
    results: list[dict[str, Any]] = []
    async with httpx.AsyncClient(base_url=args.base_url.rstrip("/"), headers=headers, timeout=timeout) as client:
        conversation_id = None
        for _ in range(args.repeat):
            for prompt in DEFAULT_PROMPTS:
                result = await run_case(client, prompt=prompt, effort=args.effort, conversation_id=conversation_id)
                conversation_id = result.get("conversation_id") or conversation_id
                results.append(result)
                print(json.dumps(result, ensure_ascii=False, separators=(",", ":")))
    print(json.dumps(summarize(results), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
