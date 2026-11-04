import logging
import re
import time
from typing import Literal, Optional

from fastapi import APIRouter, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field, field_validator

from app.config import settings
from app.core.exceptions import APIException
from app.services import contact_service
from app.services.contact_service import ContactMessage

logger = logging.getLogger("app.contact")

router = APIRouter()

EMAIL_RE = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,255}\.[^@\s]{2,}$")
# Control characters (except newline/tab) have no place in a message.
CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


class ContactRequest(BaseModel):
    category: Literal["feedback", "complaint", "content_removal", "privacy", "other"] = "feedback"
    message: str = Field(..., min_length=10, max_length=2000)
    name: Optional[str] = Field(default=None, max_length=80)
    # Optional, only so you can reply.
    email: Optional[str] = Field(default=None, max_length=254)
    # Honeypot: hidden in the form, so only bots fill it in.
    website: Optional[str] = Field(default=None, max_length=200)

    @field_validator("message", mode="before")
    @classmethod
    def clean_message(cls, v):
        if isinstance(v, str):
            return CONTROL_RE.sub("", v).strip()
        return v

    @field_validator("name", mode="before")
    @classmethod
    def clean_name(cls, v):
        # Single line only (it ends up in an email subject).
        if isinstance(v, str):
            return re.sub(r"\s+", " ", CONTROL_RE.sub("", v)).strip() or None
        return v

    @field_validator("email", mode="before")
    @classmethod
    def check_email(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        v = str(v).strip()
        if not EMAIL_RE.match(v):
            raise ValueError("Please enter a valid email address or leave it empty.")
        return v


class ContactResponse(BaseModel):
    success: bool = True
    message: str


@router.post("/contact", response_model=ContactResponse)
async def submit_contact(request: ContactRequest) -> ContactResponse:
    thanks = ContactResponse(message="Thanks! Your message has been sent.")

    if request.website:
        # Pretend it worked so bots don't learn anything.
        return thanks
    store = contact_service.contact_store
    since = int(time.time()) - contact_service.DAY_SECONDS
    if await run_in_threadpool(store.count_since, since) >= settings.CONTACT_DAILY_LIMIT:
        raise APIException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "We're receiving too many messages right now. Please try again tomorrow.",
        )

    msg = ContactMessage(
        category=request.category, message=request.message, name=request.name, email=request.email
    )
    try:
        await run_in_threadpool(store.save, msg)
    except Exception:
        logger.exception("Could not save contact message")
        raise APIException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Couldn't send your message. Please try again later.")

    if contact_service.email_configured():
        try:
            await run_in_threadpool(contact_service.send_email, msg)
        except Exception:
            # Saved already; email is a convenience. Don't fail the visitor.
            logger.exception("Could not forward contact message by email")

    return thanks
