import logging
import sys
from app.config import settings

# Structured formatting for logs
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s - %(message)s"

def setup_logging() -> None:
    """
    Initializes structured console logging for the application.
    Integrates with standard Python logging.
    """
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format=LOG_FORMAT,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ],
        force=True  # Force re-configuration if standard loggers were already initialized
    )

    # Set logger specific levels
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)  # Reduce noise, custom logging middleware covers requests

    logger = logging.getLogger("app")
    logger.info("Logging configured successfully.")
