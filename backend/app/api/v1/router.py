from fastapi import APIRouter
from app.api.v1.endpoints import router as base_endpoints

api_router = APIRouter()

# Registering baseline endpoints
api_router.include_router(base_endpoints)

# Future domain routes (Phase 2.2+) can be appended here:
# api_router.include_router(articles.router, prefix="/articles", tags=["articles"])
# api_router.include_router(users.router, prefix="/users", tags=["users"])
