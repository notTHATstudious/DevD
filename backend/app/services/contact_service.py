"""
Contact form storage and (optional) email forwarding.

Messages go into a small SQLite file on the server. If SMTP settings are
configured, each message is also emailed to CONTACT_EMAIL_TO. The owner's
address is only ever used here, server-side; it is never sent to the browser.
No IP addresses are stored.
"""
import logging
import os
import smtplib
import sqlite3
import time
from dataclasses import dataclass
from email.message import EmailMessage
from typing import List, Optional

from app.config import settings

logger = logging.getLogger("app.contact")

CATEGORIES = ("feedback", "complaint", "content_removal", "privacy", "other")

DAY_SECONDS = 24 * 60 * 60

SCHEMA = """
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at INTEGER NOT NULL,
    category TEXT NOT NULL,
    name TEXT,
    email TEXT,
    message TEXT NOT NULL
)
"""


@dataclass
class ContactMessage:
    category: str
    message: str
    name: Optional[str] = None
    email: Optional[str] = None
    id: Optional[int] = None
    created_at: Optional[int] = None


def _connect(path: str) -> sqlite3.Connection:
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    conn = sqlite3.connect(path, timeout=5)
    conn.execute(SCHEMA)
    return conn


class ContactStore:
    def __init__(self, path: str):
        self.path = path

    def count_since(self, since: int) -> int:
        with _connect(self.path) as conn:
            return conn.execute("SELECT COUNT(*) FROM messages WHERE created_at >= ?", (since,)).fetchone()[0]

    def save(self, msg: ContactMessage, now: Optional[int] = None) -> int:
        now = now or int(time.time())
        with _connect(self.path) as conn:
            cur = conn.execute(
                "INSERT INTO messages (created_at, category, name, email, message) VALUES (?, ?, ?, ?, ?)",
                (now, msg.category, msg.name, msg.email, msg.message),
            )
            # Keep only what the privacy policy promises.
            cutoff = now - settings.CONTACT_RETENTION_DAYS * DAY_SECONDS
            conn.execute("DELETE FROM messages WHERE created_at < ?", (cutoff,))
            return int(cur.lastrowid)

    def latest(self, limit: int = 20) -> List[ContactMessage]:
        with _connect(self.path) as conn:
            rows = conn.execute(
                "SELECT id, created_at, category, name, email, message FROM messages ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [
            ContactMessage(id=r[0], created_at=r[1], category=r[2], name=r[3], email=r[4], message=r[5])
            for r in rows
        ]


def email_configured() -> bool:
    return bool(settings.CONTACT_EMAIL_TO and settings.SMTP_HOST and settings.SMTP_FROM)


def send_email(msg: ContactMessage) -> None:
    """Forward a message to the owner's inbox. Runs in a worker thread."""
    mail = EmailMessage()
    mail["Subject"] = f"[DailyD] {msg.category.replace('_', ' ')} from {msg.name or 'anonymous'}"
    mail["From"] = settings.SMTP_FROM
    mail["To"] = settings.CONTACT_EMAIL_TO
    if msg.email:
        # Reply goes straight to the visitor; your address stays private until you reply.
        mail["Reply-To"] = msg.email
    mail.set_content(
        f"Category: {msg.category}\n"
        f"Name: {msg.name or '-'}\n"
        f"Email: {msg.email or '-'}\n\n"
        f"{msg.message}\n"
    )
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
        smtp.starttls()
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        smtp.send_message(mail)


contact_store = ContactStore(settings.CONTACT_DB_PATH)
