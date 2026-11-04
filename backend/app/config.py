import json
from pathlib import Path
from typing import Any, List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "DailyD Backend"
    APP_VERSION: str = "3.2"
    APP_ENV: str = "development"
    DEBUG: bool = False

    # Feed cache
    CACHE_REFRESH_SECONDS: int = 300
    # First refresh after boot only waits this long for slow feeds.
    COLD_START_DEADLINE_SECONDS: float = 4.0
    BACKGROUND_REFRESH: bool = True  # tests turn this off to avoid network calls
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS Configurations
    CORS_ORIGINS: List[str] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            # Try to load as a JSON list (e.g. '["http://localhost:5173"]')
            if v.startswith("["):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            # Fallback to comma-separated values (e.g. 'http://localhost:5173,http://localhost:3000')
            return [item.strip() for item in v.split(",") if item.strip()]
        if isinstance(v, list):
            return [str(item) for item in v]
        raise ValueError(f"Invalid format for CORS_ORIGINS: {v}")

    # Contact form. Messages are saved in a small SQLite file on the server.
    # Default: backend/data/messages.db (in Docker: /workspace/data/messages.db).
    CONTACT_DB_PATH: str = str(Path(__file__).resolve().parent.parent / "data" / "messages.db")
    CONTACT_RETENTION_DAYS: int = 365
    CONTACT_DAILY_LIMIT: int = 200  # total messages per day, against spam floods
    # Optional: also email each message to you. The address never reaches the browser.
    CONTACT_EMAIL_TO: str | None = None
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str | None = None

    # Future phase placeholders
    DATABASE_URL: str | None = None
    REDIS_URL: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
