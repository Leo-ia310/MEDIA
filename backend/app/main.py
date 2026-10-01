from pathlib import Path
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import auth, chat, clinical, conversations, feedback, health, knowledge, learning, library, tools
from app.core.config import get_settings
from app.core.exceptions import ProviderError
from app.core.latency import MediaLatencyMetrics, reset_current_metrics, set_current_metrics
from app.core.logging import configure_logging

settings = get_settings()
configure_logging(settings.log_level)
logger = logging.getLogger(__name__)

app = FastAPI(title="Media Medical Tutor Backend", version="0.1.0")

references_path = Path(settings.references_dir).expanduser()
if references_path.exists():
    app.mount("/references", StaticFiles(directory=references_path), name="references")


def cors_headers_for(request: Request) -> dict[str, str]:
    origin = request.headers.get("origin")
    if origin in settings.cors_origins:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin",
        }
    return {}


@app.exception_handler(HTTPException)
async def http_exception_with_cors(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=cors_headers_for(request),
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def add_cors_to_error_responses(request, call_next):
    metrics = None
    metrics_token = None
    if request.method == "POST" and request.url.path == "/api/chat":
        metrics = MediaLatencyMetrics()
        metrics_token = set_current_metrics(metrics)
        request.state.media_request_id = metrics.request_id
    try:
        response = await call_next(request)
    except ProviderError as exc:
        logger.warning("ProviderError during request path=%s status_code=%s detail=%s", request.url.path, exc.status_code, str(exc))
        content = {"detail": str(exc), "code": "provider_error"}
        if metrics is not None:
            metrics.finish()
            content["metadata"] = {"media_latency": metrics.snapshot()}
            rag_metrics = content["metadata"]["media_latency"].get("rag_internal_metrics")
            if isinstance(rag_metrics, dict):
                content["metadata"]["rag_metrics"] = rag_metrics
        response = JSONResponse(status_code=503, content=content)
    except Exception:
        response = JSONResponse(status_code=500, content={"detail": "Unexpected backend error", "code": "backend_error"})
    finally:
        if metrics is not None:
            metrics.log()
        if metrics_token is not None:
            reset_current_metrics(metrics_token)
    origin = request.headers.get("origin")
    if origin in settings.cors_origins:
        response.headers.update(cors_headers_for(request))
    return response

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(learning.router)
app.include_router(feedback.router)
app.include_router(library.router)
app.include_router(knowledge.router)
app.include_router(tools.router)
app.include_router(clinical.router)

frontend_path = Path(__file__).resolve().parents[2]
assets_path = frontend_path / "assets"
vendor_path = frontend_path / "vendor"
if assets_path.exists():
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
if vendor_path.exists():
    app.mount("/vendor", StaticFiles(directory=vendor_path), name="vendor")


@app.get("/", include_in_schema=False)
async def frontend_index():
    return FileResponse(frontend_path / "index.html")


@app.get("/{filename:path}", include_in_schema=False)
async def frontend_file(filename: str):
    allowed_files = {"index.html", "app.js", "styles.css", "config.js"}
    if filename in allowed_files:
        path = frontend_path / filename
        if path.exists():
            return FileResponse(path)
    raise HTTPException(status_code=404, detail="Not found")
