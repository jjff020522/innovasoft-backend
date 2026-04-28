from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.auth import router as auth_router
from app.api.routes.clients import router as clients_router
from app.core.config import get_settings
from app.core.exceptions import ExternalAPIError
from app.db.mongo import connect_to_mongo, disconnect_from_mongo

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    debug=settings.debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporal para probar, luego pon la URL de Netlify
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(clients_router, prefix="/api/clientes", tags=["clientes"])


@app.exception_handler(ExternalAPIError)
async def handle_external_api_error(
    request: Request,  # noqa: ARG001
    exc: ExternalAPIError,
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "source": "innovasoft-api",
            "payload": exc.payload,
        },
    )


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
async def startup_event() -> None:
    await connect_to_mongo(settings)


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await disconnect_from_mongo()


@app.get("/")
def check_health():
    return {"status": "Funcionando correctamente en Railway"}
