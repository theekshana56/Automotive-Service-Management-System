"""Minimal FastAPI server used only for debugging connectivity.

Run:
  cd ml
  ./venv/Scripts/Activate.ps1
  python -m uvicorn src.minimal_health_server:app --port 8055 --log-level debug

Then test:
  Invoke-RestMethod http://127.0.0.1:8055/health
"""
from fastapi import FastAPI

app = FastAPI(title="MinimalHealthServer")

@app.get('/health')
def health():
    return {"status": "ok", "server": "minimal"}
