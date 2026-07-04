from fastapi import APIRouter
from app.config import settings

router = APIRouter()

@router.get("/")
async def get_service_info() -> dict:
    """Returns basic service details."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "status": "running"
    }

@router.get("/health")
async def get_health() -> dict:
    """Standard health check endpoint."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION
    }
