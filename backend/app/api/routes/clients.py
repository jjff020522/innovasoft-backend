from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends

from app.api.deps import (
    get_current_user_session,
    get_innovasoft_service,
    get_repository,
)
from app.core.exceptions import ExternalAPIError
from app.db.repositories import MongoRepository
from app.models.auth import SessionUser
from app.models.client import (
    ClientDetail,
    ClientListItem,
    ClientSearchRequest,
    CreateClientRequest,
    InterestItem,
    UpdateClientRequest,
)
from app.models.common import MessageResponse
from app.services.innovasoft_api import InnovasoftAPIService


router = APIRouter()


def _extract_client_id(payload: dict[str, Any] | list[Any] | str | None) -> str:
    if isinstance(payload, dict):
        for key in ("id", "clienteId", "clientId"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value
    return "N/A"


def _to_update_datetime(value: str) -> str:
    parsed_date = datetime.fromisoformat(value)
    return parsed_date.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")


@router.post("/listado", response_model=list[ClientListItem])
async def listado_clientes(
    payload: ClientSearchRequest,
    session: SessionUser = Depends(get_current_user_session),
    innovasoft_service: InnovasoftAPIService = Depends(get_innovasoft_service),
    repository: MongoRepository = Depends(get_repository),
) -> list[ClientListItem]:
    data = await innovasoft_service.listado_clientes(
        token=session.token,
        usuario_id=session.userid,
        identificacion=payload.identificacion,
        nombre=payload.nombre,
    )
    hidden_client_ids = await repository.get_hidden_client_ids()
    if hidden_client_ids:
        data = [item for item in data if str(item.get("id") or "") not in hidden_client_ids]
    return [ClientListItem.model_validate(item) for item in data]


@router.get("/intereses", response_model=list[InterestItem])
async def listado_intereses(
    session: SessionUser = Depends(get_current_user_session),
    innovasoft_service: InnovasoftAPIService = Depends(get_innovasoft_service),
) -> list[InterestItem]:
    data = await innovasoft_service.intereses(token=session.token)
    return [InterestItem.model_validate(item) for item in data]


@router.get("/obtener/{cliente_id}", response_model=ClientDetail)
async def obtener_cliente(
    cliente_id: str,
    session: SessionUser = Depends(get_current_user_session),
    innovasoft_service: InnovasoftAPIService = Depends(get_innovasoft_service),
) -> ClientDetail:
    data = await innovasoft_service.obtener_cliente(
        token=session.token,
        cliente_id=cliente_id,
    )
    return ClientDetail.from_api_payload(data)


@router.post("/crear")
async def crear_cliente(
    payload: CreateClientRequest,
    session: SessionUser = Depends(get_current_user_session),
    innovasoft_service: InnovasoftAPIService = Depends(get_innovasoft_service),
    repository: MongoRepository = Depends(get_repository),
) -> MessageResponse:
    status_code = 503
    client_id = "N/A"

    outbound_payload = payload.model_dump(mode="json")
    if outbound_payload.get("imagen") is None:
        outbound_payload["imagen"] = ""
    if outbound_payload.get("otroTelefono") is None:
        outbound_payload["otroTelefono"] = ""
    outbound_payload["usuarioId"] = session.userid
    outbound_payload["celular"] = outbound_payload.pop("telefonoCelular")
    outbound_payload["resennaPersonal"] = outbound_payload.pop("resenaPersonal")
    outbound_payload["fNacimiento"] = _to_update_datetime(outbound_payload["fNacimiento"])
    outbound_payload["fAfiliacion"] = _to_update_datetime(outbound_payload["fAfiliacion"])

    try:
        response = await innovasoft_service.crear_cliente(
            token=session.token,
            payload=outbound_payload,
        )
        status_code = response.status_code
        client_id = _extract_client_id(innovasoft_service._safe_json(response))
        if client_id == "N/A":
            try:
                created_clients = await innovasoft_service.listado_clientes(
                    token=session.token,
                    usuario_id=session.userid,
                    identificacion=payload.identificacion,
                )
                for created_client in created_clients:
                    if created_client.get("identificacion") == payload.identificacion:
                        client_id = str(created_client.get("id") or "N/A")
                        break
            except ExternalAPIError:
                client_id = "N/A"
    except ExternalAPIError as exc:
        status_code = exc.status_code
        raise
    finally:
        await repository.log_operation(
            action="CREAR",
            username=session.username,
            client_id=client_id,
            result_code=status_code,
        )

    return MessageResponse(message="Cliente creado correctamente.")


@router.post("/actualizar")
async def actualizar_cliente(
    payload: UpdateClientRequest,
    session: SessionUser = Depends(get_current_user_session),
    innovasoft_service: InnovasoftAPIService = Depends(get_innovasoft_service),
    repository: MongoRepository = Depends(get_repository),
) -> MessageResponse:
    status_code = 503
    client_id = payload.id

    outbound_payload = payload.model_dump(mode="json")
    outbound_payload["usuarioId"] = session.userid

    # La API externa pide "celular" y "resennaPersonal" para actualizar.
    outbound_payload["celular"] = outbound_payload.pop("telefonoCelular")
    outbound_payload["resennaPersonal"] = outbound_payload.pop("resenaPersonal")
    outbound_payload["fNacimiento"] = _to_update_datetime(outbound_payload["fNacimiento"])
    outbound_payload["fAfiliacion"] = _to_update_datetime(outbound_payload["fAfiliacion"])

    try:
        response = await innovasoft_service.actualizar_cliente(
            token=session.token,
            payload=outbound_payload,
        )
        status_code = response.status_code
    except ExternalAPIError as exc:
        status_code = exc.status_code
        raise
    finally:
        await repository.log_operation(
            action="ACTUALIZAR",
            username=session.username,
            client_id=client_id,
            result_code=status_code,
        )

    return MessageResponse(message="Cliente actualizado correctamente.")


@router.delete("/eliminar/{cliente_id}")
async def eliminar_cliente(
    cliente_id: str,
    session: SessionUser = Depends(get_current_user_session),
    innovasoft_service: InnovasoftAPIService = Depends(get_innovasoft_service),
    repository: MongoRepository = Depends(get_repository),
) -> MessageResponse:
    status_code = 503
    try:
        response = await innovasoft_service.eliminar_cliente(
            token=session.token,
            cliente_id=cliente_id,
        )
        status_code = response.status_code
        await repository.hide_client(
            client_id=cliente_id,
            username=session.username,
        )
    except ExternalAPIError as exc:
        status_code = exc.status_code
        if exc.status_code == 405:
            await repository.hide_client(
                client_id=cliente_id,
                username=session.username,
            )
            status_code = 200
            return MessageResponse(message="Cliente eliminado correctamente.")
        raise
    finally:
        await repository.log_operation(
            action="ELIMINAR",
            username=session.username,
            client_id=cliente_id,
            result_code=status_code,
        )

    return MessageResponse(message="Cliente eliminado correctamente.")
