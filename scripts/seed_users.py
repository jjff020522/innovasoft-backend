import asyncio
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings


async def seed_users():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]

    users_collection = db.users

    # Seed some test users
    test_users = [
        {
            "username": "testuser2026",
            "email": "test2026@example.com",
            "registered_timestamp": datetime.now(timezone.utc).isoformat(),
        },
        {
            "username": "admin",
            "email": "admin@example.com",
            "registered_timestamp": datetime.now(timezone.utc).isoformat(),
        },
    ]

    for user in test_users:
        await users_collection.update_one(
            {"username": user["username"]},
            {"$set": user},
            upsert=True
        )

    print("Users seeded successfully.")


if __name__ == "__main__":
    asyncio.run(seed_users())