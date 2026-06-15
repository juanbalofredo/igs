from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from auth import AuthError, login_with_credentials
from config import get_settings
from sync import sync_account_for_user, sync_all_tracked, track_account, untrack_account

app = FastAPI(title="IG Tracker Scraper")


def verify_api_key(x_api_key: str = Header(...)) -> None:
    if x_api_key != get_settings()["api_key"]:
        raise HTTPException(status_code=401, detail="API key inválida")


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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/login", dependencies=[Depends(verify_api_key)])
def auth_login(body: LoginRequest):
    try:
        result = login_with_credentials(body.username, body.password, body.verification_code)
        return {"success": True, **result}
    except AuthError as exc:
        return {"success": False, "error_code": exc.code, "error_message": exc.message}


@app.post("/track", dependencies=[Depends(verify_api_key)])
def track(body: TrackRequest):
    result = track_account(body.user_id, body.username)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


@app.post("/untrack", dependencies=[Depends(verify_api_key)])
def untrack(body: UntrackRequest):
    result = untrack_account(body.user_id, body.username)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result)
    return result


@app.post("/sync", dependencies=[Depends(verify_api_key)])
def sync(body: SyncRequest):
    result = sync_account_for_user(body.user_id, body.username)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


@app.post("/sync/all", dependencies=[Depends(verify_api_key)])
def sync_all():
    return sync_all_tracked()
