import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging

# Initialize logging before FastAPI startup
setup_logging()
logger = logging.getLogger("app")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    redoc_url="/redoc" if settings.APP_ENV != "production" else None,
)

# Apply CORS Middleware configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging Middleware to record execution times and route hits
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.perf_counter()
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration in milliseconds
    duration_ms = (time.perf_counter() - start_time) * 1000
    
    logger.info(
        f"Method={request.method} Path={request.url.path} "
        f"Status={response.status_code} Duration={duration_ms:.2f}ms"
    )
    
    # Return custom header for performance monitoring
    response.headers["X-Response-Time-Ms"] = f"{duration_ms:.2f}"
    return response

# Register Centralized Error and Exception Handlers
register_exception_handlers(app)

# Mount Routers (base router handles '/' and '/health')
app.include_router(api_router)
