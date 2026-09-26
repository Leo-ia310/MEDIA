from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import auth, chat, clinical, conversations, health, knowledge, learning, tools
from app.core.config import get_settings
from app.core.exceptions import ProviderError
from app.core.logging import configure_logging

settings = get_settings()
configure_logging(settings.log_level)

app = FastAPI(title="AIAME Medical Tutor Backend", version="0.1.0")

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
    try:
        response = await call_next(request)
    except ProviderError as exc:
        response = JSONResponse(status_code=503, content={"detail": str(exc), "code": "provider_error"})
    except Exception:
        response = JSONResponse(status_code=500, content={"detail": "Unexpected backend error", "code": "backend_error"})
    origin = request.headers.get("origin")
    if origin in settings.cors_origins:
        response.headers.update(cors_headers_for(request))
    return response

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(learning.router)
app.include_router(knowledge.router)
app.include_router(tools.router)
app.include_router(clinical.router)
