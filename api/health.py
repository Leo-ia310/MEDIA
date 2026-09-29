from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

from vercel_function import (
    bad_request,
    handle_options,
    method_not_allowed,
    read_json,
    run_async,
    session_response,
    unauthorized,
    write_json,
)


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self) -> None:
        handle_options(self)

    def do_GET(self) -> None:
        write_json(
            self,
            200,
            {
                "status": "healthy",
                "backend": "healthy",
                "database": "healthy",
                "ai_provider_configuration": "healthy",
                "details": {"runtime": "vercel-python-function"},
            },
        )

    def do_POST(self) -> None:
        from app.core.config import get_settings
        from app.core.exceptions import AuthenticationError
        from app.db.local_store import LocalAppStore
        from app.models.schemas import AuthCredentials, RefreshTokenIn

        action = (parse_qs(urlparse(self.path).query).get("action") or [""])[0]
        try:
            payload = read_json(self)
            store = LocalAppStore(get_settings())
            if action == "login":
                data = run_async(store.login(AuthCredentials(**payload)))
            elif action == "register":
                data = run_async(store.register(AuthCredentials(**payload)))
            elif action == "refresh":
                parsed = RefreshTokenIn(**payload)
                data = run_async(store.refresh_session(refresh_token=parsed.refresh_token))
            else:
                method_not_allowed(self)
                return
            write_json(self, 200, session_response(data))
        except AuthenticationError as exc:
            unauthorized(self, str(exc))
        except Exception as exc:
            bad_request(self, str(exc))
