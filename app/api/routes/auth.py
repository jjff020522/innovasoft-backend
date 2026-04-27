from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import (
    get_current_user_session,
    get_innovasoft_service,
    get_repository,
)
from app.db.repositories import MongoRepository
from app.models.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    SessionUser,
)
from app.models.common import MessageResponse
from app.services.innovasoft_api import InnovasoftAPIService


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    innovasoft_service: InnovasoftAPIService = Depends(get_innovasoft_service),
    repository: MongoRepository = Depends(get_repository),
) -> LoginResponse:
    response = await innovasoft_service.login(
        username=payload.username,
        password=payload.password,
    )
    model = LoginResponse.model_validate(response)

    await repository.upsert_session(
        token=model.token,
        userid=model.userid,
        username=model.username,
        user_data={
            "userid": model.userid,
            "username": model.username,
            "expiration": str(model.expiration),
        },
    )
    return model


@router.post("/register", response_model=RegisterResponse)
async def register(
    payload: RegisterRequest,
    innovasoft_service: InnovasoftAPIService = Depends(get_innovasoft_service),
) -> RegisterResponse:
    response = await innovasoft_service.register(
        username=payload.username,
        email=payload.email,
        password=payload.password,
    )
    return RegisterResponse.model_validate(response)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    session: SessionUser = Depends(get_current_user_session),
    repository: MongoRepository = Depends(get_repository),
) -> MessageResponse:
    await repository.delete_session_by_token(session.token)
    return MessageResponse(message="La sesión se cerró correctamente.")


@router.get("/session", response_model=SessionUser)
async def get_session_data(
    session: SessionUser = Depends(get_current_user_session),
) -> SessionUser:
    return session
