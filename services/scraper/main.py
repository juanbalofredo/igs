from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

app = FastAPI(title="IG Tracker Scraper")


def verify_api_key(x_api_key: str = Header(...)) -> None:
    try:
        from config import get_settings

        if x_api_key != get_settings()["api_key"]:
            raise HTTPException(status_code=401, detail={"error_code": "unauthorized", "error_message": "API key inválida"})
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail={"error_code": "config_error", "error_message": str(exc)}) from exc


class LoginRequest(BaseModel):
    username: str
    password: str
    verification_code: str | None = None


class TrackRequest(BaseModel):
    user_id: str
    username: str = Field(min_length=1)


class SyncRequest(BaseModel):
    user_id: str
    username: str = Field(min_length=1)


class UntrackRequest(BaseModel):
    user_id: str
    username: str = Field(min_length=1)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error_code": "server_error",
            "error_message": str(exc),
        },
    )


@app.get("/")
def root():
    return {"status": "ok", "service": "ig-tracker-scraper"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db", dependencies=[Depends(verify_api_key)])
def health_db():
    from db import get_supabase

    supabase = get_supabase()
    result = supabase.table("users").select("id").limit(1).execute()
    return {"status": "ok", "users_sample": len(result.data or [])}


@app.post("/auth/login", dependencies=[Depends(verify_api_key)])
def auth_login(body: LoginRequest):
    from auth import AuthError, login_with_credentials

    try:
        result = login_with_credentials(body.username, body.password, body.verification_code)
        return {"success": True, **result}
    except AuthError as exc:
        return {"success": False, "error_code": exc.code, "error_message": exc.message}
    except Exception as exc:
        return {
            "success": False,
            "error_code": "server_error",
            "error_message": f"Error del servidor: {exc}",
        }


@app.post("/track", dependencies=[Depends(verify_api_key)])
def track(body: TrackRequest):
    from sync import track_account

    result = track_account(body.user_id, body.username)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


@app.post("/untrack", dependencies=[Depends(verify_api_key)])
def untrack(body: UntrackRequest):
    from sync import untrack_account

    result = untrack_account(body.user_id, body.username)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result)
    return result


@app.post("/sync", dependencies=[Depends(verify_api_key)])
def sync(body: SyncRequest):
    from sync import sync_account_for_user

    result = sync_account_for_user(body.user_id, body.username)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


@app.post("/sync/all", dependencies=[Depends(verify_api_key)])
def sync_all():
    from sync import sync_all_tracked

    return sync_all_tracked()
