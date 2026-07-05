from fastapi import APIRouter
from app.api.v1.endpoints import router as base_endpoints
from app.api.v1.endpoints.articles import router as articles_endpoints
from app.api.v1.endpoints.assistant import router as assistant_endpoints

api_router = APIRouter()

# Registering baseline endpoints at the root level (GET / and GET /health)
api_router.include_router(base_endpoints)

# Registering versioned domain routes (GET /api/v1/articles)
api_router.include_router(articles_endpoints, prefix="/api/v1", tags=["articles"])
api_router.include_router(assistant_endpoints, prefix="/api/v1/devd-assistant", tags=["assistant"])

