"""
Read contact form messages on the server:

    python -m app.messages          # latest 20
    python -m app.messages 100      # latest 100
"""
import sys
from datetime import datetime

from app.services.contact_service import contact_store


def main() -> None:
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    messages = contact_store.latest(limit)
    if not messages:
        print("No messages yet.")
        return
    for m in messages:
        when = datetime.fromtimestamp(m.created_at or 0).strftime("%Y-%m-%d %H:%M")
        who = m.name or "anonymous"
        reply = f" <{m.email}>" if m.email else ""
        print(f"#{m.id}  {when}  [{m.category}]  {who}{reply}")
        print(f"    {m.message}\n")


if __name__ == "__main__":
    main()
