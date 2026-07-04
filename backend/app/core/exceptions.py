import logging
from typing import Any, Dict, List, Union
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("app")

class APIException(Exception):
    """
    Base exception class for application-specific errors.
    Can be raised in services, adapters, or endpoints to return standard client-facing errors.
    """
    def __init__(
        self,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        message: str = "An error occurred.",
        details: Union[Dict[str, Any], List[Any], None] = None
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.details = details

async def api_exception_handler(request: Request, exc: APIException) -> JSONResponse:
    """Handles custom APIException errors."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "message": exc.message,
                "details": exc.details or {}
            }
        }
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handles standard FastAPI/Starlette HTTPException errors."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "message": exc.detail,
                "details": {}
            }
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handles request validation errors (Pydantic validation)."""
    errors = []
    for error in exc.errors():
        # Get path of input error (e.g. body -> username)
        loc = " -> ".join([str(x) for x in error["loc"][1:]]) if len(error["loc"]) > 1 else str(error["loc"][0])
        errors.append({
            "field": loc,
            "type": error["type"],
            "message": error["msg"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "message": "Validation failed.",
                "details": errors
            }
        }
    )

async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Fallback handler for any unhandled standard Python exceptions."""
    logger.exception(f"Unhandled system error occurred at {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "message": "An unexpected server error occurred.",
                "details": {}
            }
        }
    )

def register_exception_handlers(app: FastAPI) -> None:
    """Registers exception handlers onto the FastAPI application instance."""
    app.add_exception_handler(APIException, api_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
