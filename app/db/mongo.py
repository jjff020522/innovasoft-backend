from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import Settings


mongo_client: AsyncIOMotorClient | None = None
database: AsyncIOMotorDatabase | None = None


async def connect_to_mongo(settings: Settings) -> None:
    global mongo_client, database

    mongo_client = AsyncIOMotorClient(settings.mongodb_uri)
    await mongo_client.admin.command("ping")
    database = mongo_client[settings.mongodb_db_name]

    await database.sesiones.create_index("token", unique=True)
    await database.sesiones.create_index("userid")

    await database.operaciones.create_index("timestamp")
    await database.operaciones.create_index("cliente_id")

    await database.clientes_ocultos.create_index("client_id", unique=True)


async def disconnect_from_mongo() -> None:
    global mongo_client, database
    if mongo_client is not None:
        mongo_client.close()
    mongo_client = None
    database = None


def get_database() -> AsyncIOMotorDatabase:
    if database is None:
        raise RuntimeError("MongoDB is not initialized.")
    return database
