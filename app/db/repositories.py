from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class MongoRepository:
    def __init__(self, database: AsyncIOMotorDatabase) -> None:
        self.database = database

    @property
    def sesiones(self):
        return self.database.sesiones

    @property
    def operaciones(self):
        return self.database.operaciones

    @property
    def clientes_ocultos(self):
        return self.database.clientes_ocultos

    async def upsert_session(
        self,
        token: str,
        userid: str,
        username: str,
        user_data: dict[str, Any] | None = None,
    ) -> None:
        await self.sesiones.delete_many({"userid": userid})
        await self.sesiones.insert_one(
            {
                "token": token,
                "userid": userid,
                "username": username,
                "user_data": user_data or {},
                "login_timestamp": utc_now_iso(),
            }
        )

    async def get_session_by_token(self, token: str) -> dict[str, Any] | None:
        return await self.sesiones.find_one({"token": token}, {"_id": 0})

    async def delete_session_by_token(self, token: str) -> int:
        result = await self.sesiones.delete_one({"token": token})
        return result.deleted_count

    async def log_operation(
        self,
        action: str,
        username: str,
        client_id: str,
        result_code: int,
    ) -> None:
        await self.operaciones.insert_one(
            {
                "accion": action,
                "usuario": username,
                "cliente_id": client_id,
                "timestamp": utc_now_iso(),
                "resultado": result_code,
            }
        )

    async def get_hidden_client_ids(self) -> set[str]:
        hidden_clients = await self.clientes_ocultos.find({}, {"_id": 0, "client_id": 1}).to_list(length=None)
        return {
            item["client_id"]
            for item in hidden_clients
            if isinstance(item.get("client_id"), str) and item["client_id"].strip()
        }

    async def hide_client(
        self,
        client_id: str,
        username: str,
    ) -> None:
        await self.clientes_ocultos.update_one(
            {"client_id": client_id},
            {
                "$set": {
                    "client_id": client_id,
                    "hidden_by": username,
                    "hidden_timestamp": utc_now_iso(),
                }
            },
            upsert=True,
        )
