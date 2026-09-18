from app.main import app


def test_auth_routes_are_registered_in_openapi() -> None:
    schema = app.openapi()

    assert "/api/auth/register" in schema["paths"]
    assert "/api/auth/login" in schema["paths"]
