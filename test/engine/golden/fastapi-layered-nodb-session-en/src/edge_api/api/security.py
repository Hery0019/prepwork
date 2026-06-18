"""Cookie session, held by the API itself.

`configure_security` is the contract the composition root calls,
whatever the active option is.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, FastAPI, Request, Response, status
from pydantic import BaseModel
from starlette.middleware.sessions import SessionMiddleware

from edge_api.domain.exceptions import UnauthorizedError

router = APIRouter(prefix="/auth", tags=["auth"])


class Credentials(BaseModel):
    username: str
    password: str


def current_user(request: Request) -> str:
    """SECS-005 : a single dependency reads the session; no route does it itself."""
    user = request.session.get("user")
    if not isinstance(user, str):
        raise UnauthorizedError("authentication required")
    return user


UserDep = Annotated[str, Depends(current_user)]


@router.post("/login", status_code=status.HTTP_204_NO_CONTENT)
async def login(credentials: Credentials, request: Request) -> Response:
    """SECS-004 : login rotates the session identifier."""
    request.session.clear()
    request.session["user"] = credentials.username
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request) -> Response:
    request.session.clear()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def configure_security(app: FastAPI) -> None:
    """Session middleware, then the authentication router."""
    settings = app.state.settings
    app.add_middleware(
        SessionMiddleware,
        # SECS-002 : the secret comes from the environment and has no default.
        secret_key=settings.session_secret,
        # SECS-001 : out of JavaScript, out of plaintext, out of cross-site requests.
        session_cookie=settings.session_cookie_name,
        https_only=True,
        same_site="lax",
    )
    app.include_router(router, prefix="/api/v1")
