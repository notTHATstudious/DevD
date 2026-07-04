# DailyD v2.0 — Backend

This is the backend for DailyD v2.0 built using **FastAPI**, **Python 3.11**, **Uvicorn**, and **Pydantic Settings**.

## Features (Phase 2.1 Foundation)
- Async-first high-performance routing with FastAPI.
- Environment-driven configuration via Pydantic Settings.
- Centralized exception handlers for standardized JSON error responses.
- Logging middleware tracking request execution times.
- CORS configurations ready for frontend integration.
- Production-ready Docker configuration.
- Robust unit tests with Pytest and httpx.

---

## Local Setup

### 1. Requirements
- Python 3.11+
- Docker & Docker Compose (optional)

### 2. Run with Virtual Environment

```bash
# Navigate to the backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the application locally
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Run with Docker Compose

```bash
# Start backend service
docker compose up --build
```

---

## Verification

### API Endpoints
- **Service Information**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### Running Tests
Execute the unit tests locally:
```bash
pytest
```
