import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env.local")
load_dotenv(BASE_DIR / ".env")


@lru_cache
def get_settings():
    return {
        "supabase_url": os.environ["SUPABASE_URL"],
        "supabase_key": os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        "encryption_key": os.environ["ENCRYPTION_KEY"],
        "api_key": os.environ["API_KEY"],
        "port": int(os.environ.get("PORT", "8000")),
    }
