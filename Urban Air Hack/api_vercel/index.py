"""Vercel serverless entrypoint — exports the live (Supabase-backed) API."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from api.live_api import app  # noqa: E402,F401
