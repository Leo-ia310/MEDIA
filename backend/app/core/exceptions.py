from fastapi import HTTPException, status


class ProviderError(Exception):
    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class ModelUnavailableError(ProviderError):
    pass


class AuthenticationError(Exception):
    pass


def unauthorized(message: str = "Authentication required") -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)


def forbidden(message: str = "Not authorized for this resource") -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
