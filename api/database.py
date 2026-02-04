from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from api.config import settings

client: AsyncIOMotorClient | None = None


async def init_db():
    """Initialize MongoDB connection and Beanie ODM."""
    global client
    client = AsyncIOMotorClient(settings.mongodb_uri)

    # Import models here to avoid circular imports
    from api.models.role import Role

    await init_beanie(
        database=client[settings.mongodb_database],
        document_models=[Role],
    )


async def close_db():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        client = None
