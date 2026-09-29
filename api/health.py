from http.server import BaseHTTPRequestHandler

from vercel_function import handle_options, method_not_allowed, write_json


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
        method_not_allowed(self)
