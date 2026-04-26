from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import Settings, get_settings
from app.db.mongo import get_database
from app.db.repositories import MongoRepository
from app.models.auth import SessionUser
from app.services.innovasoft_api import InnovasoftAPIService


http_bearer = HTTPBearer(auto_error=False)


def get_app_settings() -> Settings:
    return get_settings()


def get_repository() -> MongoRepository:
    return MongoRepository(get_database())


def get_innovasoft_service(
    settings: Settings = Depends(get_app_settings),
) -> InnovasoftAPIService:
    return InnovasoftAPIService(settings)


async def get_current_user_session(
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    repository: MongoRepository = Depends(get_repository),
) -> SessionUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere autenticación.",
        )

    token = credentials.credentials.strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido.",
        )

    session = await repository.get_session_by_token(token)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sesión no existe o expiró. Inicie sesión nuevamente.",
        )

    return SessionUser(token=token, userid=session["userid"], username=session["username"])

