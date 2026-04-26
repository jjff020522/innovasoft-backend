from __future__ import annotations

from typing import Any

import httpx

from app.core.config import Settings
from app.core.exceptions import ExternalAPIError


class InnovasoftAPIService:
    def __init__(self, settings: Settings) -> None:
        self.base_url = settings.innovasoft_api_base_url
        self.timeout = settings.innovasoft_timeout_seconds

    async def _request(
        self,
        method: str,
        endpoint: str,
        *,
        token: str | None = None,
        payload: dict[str, Any] | None = None,
    ) -> httpx.Response:
        headers: dict[str, str] = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        try:
            async with httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout,
            ) as client:
                response = await client.request(
                    method=method,
                    url=endpoint.lstrip("/"),
                    headers=headers,
                    json=payload,
                )
        except httpx.RequestError as exc:
            raise ExternalAPIError(
                status_code=503,
                detail="No fue posible comunicarse con la API de Innovasoft.",
            ) from exc

        if response.status_code >= 400:
            raise ExternalAPIError(
                status_code=response.status_code,
                detail=self._extract_detail(response),
                payload=self._safe_json(response),
            )
        return response

    async def login(self, username: str, password: str) -> dict[str, Any]:
        response = await self._request(
            "POST",
            "api/Authenticate/login",
            payload={"username": username, "password": password},
        )
        return self._safe_json(response) or {}

    async def register(self, username: str, email: str, password: str) -> dict[str, Any]:
        response = await self._request(
            "POST",
            "api/Authenticate/register",
            payload={"username": username, "email": email, "password": password},
        )
        return self._safe_json(response) or {}

    async def listado_clientes(
        self,
        token: str,
        usuario_id: str,
        identificacion: str | None = None,
        nombre: str | None = None,
    ) -> list[dict[str, Any]]:
        payload = {
            "identificacion": identificacion or "",
            "nombre": nombre or "",
            "usuarioId": usuario_id,
        }
        response = await self._request(
            "POST",
            "api/Cliente/Listado",
            token=token,
            payload=payload,
        )
        data = self._safe_json(response)
        return data if isinstance(data, list) else []

    async def intereses(self, token: str) -> list[dict[str, Any]]:
        response = await self._request(
            "GET",
            "api/Intereses/Listado",
            token=token,
        )
        data = self._safe_json(response)
        return data if isinstance(data, list) else []

    async def obtener_cliente(self, token: str, cliente_id: str) -> dict[str, Any]:
        response = await self._request(
            "GET",
            f"api/Cliente/Obtener/{cliente_id}",
            token=token,
        )
        return self._safe_json(response) or {}

    async def crear_cliente(self, token: str, payload: dict[str, Any]) -> httpx.Response:
        return await self._request(
            "POST",
            "api/Cliente/Crear",
            token=token,
            payload=payload,
        )

    async def actualizar_cliente(
        self,
        token: str,
        payload: dict[str, Any],
    ) -> httpx.Response:
        return await self._request(
            "POST",
            "api/Cliente/Actualizar",
            token=token,
            payload=payload,
        )

    async def eliminar_cliente(self, token: str, cliente_id: str) -> httpx.Response:
        endpoint = f"api/Cliente/Eliminar/{cliente_id}"

        try:
            return await self._request(
                "DELETE",
                endpoint,
                token=token,
            )
        except ExternalAPIError as exc:
            # La API externa puede rechazar DELETE con IIS aunque el contrato lo documente.
            if exc.status_code != 405:
                raise

        return await self._request(
            "POST",
            endpoint,
            token=token,
        )

    @staticmethod
    def _safe_json(response: httpx.Response) -> dict[str, Any] | list[Any] | str | None:
        try:
            return response.json()
        except ValueError:
            text = response.text.strip()
            return text if text else None

    @classmethod
    def _extract_detail(cls, response: httpx.Response) -> str:
        payload = cls._safe_json(response)

        if isinstance(payload, dict):
            for key in ("message", "detail", "error", "title"):
                value = payload.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()
            return "La API de Innovasoft respondió con un error."

        if isinstance(payload, str) and payload.strip():
            text = payload.strip()
            if text.lower().startswith("<!doctype html") or "<html" in text.lower():
                if response.status_code == 405:
                    return "La API de Innovasoft no permitio el metodo solicitado."
                return "La API de Innovasoft respondio con un error no esperado."
            return text

        return "La API de Innovasoft respondió con un error."
