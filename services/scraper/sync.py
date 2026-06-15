from datetime import date, datetime, timezone
from typing import Any

from instagrapi.exceptions import ClientError, PrivateAccount, UserNotFound

from auth import AuthError, get_client_for_user, refresh_session
from db import get_supabase
from diff import compute_changes


class SyncError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def normalize_username(username: str) -> str:
    return username.strip().lstrip("@").lower()


def _user_to_entry(user: Any) -> tuple[str, dict[str, str | None]]:
    if isinstance(user, dict):
        ig_id = str(user["pk"])
        username = user["username"]
        full_name = user.get("full_name")
    else:
        ig_id = str(user.pk)
        username = user.username
        full_name = user.full_name
    return ig_id, {"username": username, "full_name": full_name}


def _users_to_map(users: list[Any]) -> dict[str, dict[str, str | None]]:
    result: dict[str, dict[str, str | None]] = {}
    for user in users:
        ig_id, entry = _user_to_entry(user)
        result[ig_id] = entry
    return result


def _fetch_user_info(client, username: str) -> dict[str, Any]:
    try:
        user = client.user_info_by_username(username)
    except UserNotFound as exc:
        raise SyncError("user_not_found", f"La cuenta @{username} no existe") from exc
    except ClientError as exc:
        raise SyncError("fetch_failed", str(exc)) from exc

    return {
        "username": user.username.lower(),
        "ig_user_id": str(user.pk),
        "full_name": user.full_name,
        "is_private": bool(user.is_private),
        "profile_pic_url": str(user.profile_pic_url) if user.profile_pic_url else None,
    }


def _fetch_followers(client, user_id: str) -> list[Any]:
    try:
        return client.user_followers(user_id, amount=0)
    except PrivateAccount as exc:
        raise SyncError("private_no_access", "Esta cuenta es privada y no tenés acceso. Seguila desde Instagram para ver sus datos.") from exc
    except ClientError as exc:
        raise SyncError("fetch_failed", str(exc)) from exc


def _fetch_following(client, user_id: str) -> list[Any]:
    try:
        return client.user_following(user_id, amount=0)
    except PrivateAccount as exc:
        raise SyncError("private_no_access", "Esta cuenta es privada y no tenés acceso. Seguila desde Instagram para ver sus datos.") from exc
    except ClientError as exc:
        raise SyncError("fetch_failed", str(exc)) from exc


def _get_or_create_account(supabase, user_info: dict[str, Any]) -> dict[str, Any]:
    existing = (
        supabase.table("instagram_accounts")
        .select("*")
        .eq("username", user_info["username"])
        .maybe_single()
        .execute()
    )

    payload = {
        "username": user_info["username"],
        "ig_user_id": user_info["ig_user_id"],
        "full_name": user_info.get("full_name"),
        "is_private": user_info.get("is_private", False),
        "profile_pic_url": user_info.get("profile_pic_url"),
    }

    if existing.data:
        updated = supabase.table("instagram_accounts").update(payload).eq("id", existing.data["id"]).execute()
        return updated.data[0]

    inserted = supabase.table("instagram_accounts").insert(payload).execute()
    return inserted.data[0]


def _get_previous_snapshot(supabase, account_id: str) -> dict[str, Any] | None:
    result = (
        supabase.table("snapshots")
        .select("*")
        .eq("instagram_account_id", account_id)
        .order("snapshot_date", desc=True)
        .limit(1)
        .maybe_single()
        .execute()
    )
    return result.data


def _get_snapshot_users(supabase, snapshot_id: str, table: str) -> dict[str, dict[str, str | None]]:
    rows = supabase.table(table).select("ig_user_id, username, full_name").eq("snapshot_id", snapshot_id).execute()
    return {
        row["ig_user_id"]: {"username": row["username"], "full_name": row.get("full_name")}
        for row in (rows.data or [])
    }


def _save_snapshot(
    supabase,
    account_id: str,
    snapshot_date: date,
    followers_map: dict[str, dict[str, str | None]],
    following_map: dict[str, dict[str, str | None]],
) -> str:
    existing = (
        supabase.table("snapshots")
        .select("id")
        .eq("instagram_account_id", account_id)
        .eq("snapshot_date", snapshot_date.isoformat())
        .maybe_single()
        .execute()
    )

    payload = {
        "instagram_account_id": account_id,
        "snapshot_date": snapshot_date.isoformat(),
        "follower_count": len(followers_map),
        "following_count": len(following_map),
    }

    if existing.data:
        snapshot_id = existing.data["id"]
        supabase.table("snapshots").update(payload).eq("id", snapshot_id).execute()
        supabase.table("snapshot_followers").delete().eq("snapshot_id", snapshot_id).execute()
        supabase.table("snapshot_following").delete().eq("snapshot_id", snapshot_id).execute()
    else:
        inserted = supabase.table("snapshots").insert(payload).execute()
        snapshot_id = inserted.data[0]["id"]

    if followers_map:
        supabase.table("snapshot_followers").insert(
            [
                {
                    "snapshot_id": snapshot_id,
                    "ig_user_id": ig_id,
                    "username": data["username"],
                    "full_name": data.get("full_name"),
                }
                for ig_id, data in followers_map.items()
            ]
        ).execute()

    if following_map:
        supabase.table("snapshot_following").insert(
            [
                {
                    "snapshot_id": snapshot_id,
                    "ig_user_id": ig_id,
                    "username": data["username"],
                    "full_name": data.get("full_name"),
                }
                for ig_id, data in following_map.items()
            ]
        ).execute()

    return snapshot_id


def sync_account_for_user(user_id: str, username: str, snapshot_date: date | None = None) -> dict[str, Any]:
    username = normalize_username(username)
    snapshot_date = snapshot_date or date.today()
    supabase = get_supabase()

    try:
        client = get_client_for_user(user_id)
    except AuthError as exc:
        return {"username": username, "success": False, "error_code": exc.code, "error_message": exc.message}

    try:
        user_info = _fetch_user_info(client, username)
        account = _get_or_create_account(supabase, user_info)

        followers_raw = _fetch_followers(client, user_info["ig_user_id"])
        following_raw = _fetch_following(client, user_info["ig_user_id"])

        followers_map = _users_to_map(list(followers_raw.values()) if isinstance(followers_raw, dict) else followers_raw)
        following_map = _users_to_map(list(following_raw.values()) if isinstance(following_raw, dict) else following_raw)

        previous = _get_previous_snapshot(supabase, account["id"])
        previous_followers: dict[str, dict[str, str | None]] = {}
        previous_following: dict[str, dict[str, str | None]] = {}

        if previous and previous["snapshot_date"] != snapshot_date.isoformat():
            previous_followers = _get_snapshot_users(supabase, previous["id"], "snapshot_followers")
            previous_following = _get_snapshot_users(supabase, previous["id"], "snapshot_following")

        _save_snapshot(supabase, account["id"], snapshot_date, followers_map, following_map)

        if previous and previous["snapshot_date"] != snapshot_date.isoformat():
            changes = compute_changes(
                account["id"],
                previous_followers,
                followers_map,
                previous_following,
                following_map,
                snapshot_date,
            )
            if changes:
                supabase.table("changes").insert(changes).execute()

        supabase.table("instagram_accounts").update(
            {
                "last_synced_at": datetime.now(timezone.utc).isoformat(),
                "last_sync_error": None,
            }
        ).eq("id", account["id"]).execute()

        refresh_session(user_id, client)

        return {
            "success": True,
            "account_id": account["id"],
            "username": account["username"],
            "follower_count": len(followers_map),
            "following_count": len(following_map),
            "is_private": account["is_private"],
        }
    except SyncError as exc:
        account_row = (
            supabase.table("instagram_accounts")
            .select("id")
            .eq("username", username)
            .maybe_single()
            .execute()
        )
        if account_row.data:
            supabase.table("instagram_accounts").update({"last_sync_error": exc.message}).eq("id", account_row.data["id"]).execute()

        return {
            "username": username,
            "success": False,
            "error_code": exc.code,
            "error_message": exc.message,
        }


def track_account(user_id: str, username: str) -> dict[str, Any]:
    username = normalize_username(username)
    supabase = get_supabase()

    sync_result = sync_account_for_user(user_id, username)
    if not sync_result.get("success"):
        return sync_result

    account_id = sync_result["account_id"]
    supabase.table("user_tracked").upsert(
        {
            "user_id": user_id,
            "instagram_account_id": account_id,
        }
    ).execute()

    return sync_result


def untrack_account(user_id: str, username: str) -> dict[str, Any]:
    username = normalize_username(username)
    supabase = get_supabase()

    account = supabase.table("instagram_accounts").select("id").eq("username", username).maybe_single().execute()
    if not account.data:
        return {"success": False, "error_code": "not_found", "error_message": "Cuenta no encontrada"}

    supabase.table("user_tracked").delete().eq("user_id", user_id).eq("instagram_account_id", account.data["id"]).execute()
    return {"success": True}


def sync_all_tracked() -> dict[str, Any]:
    supabase = get_supabase()
    tracked = supabase.table("user_tracked").select("user_id, instagram_account_id, instagram_accounts(username)").execute()

    seen_accounts: dict[str, str] = {}
    for row in tracked.data or []:
        account = row.get("instagram_accounts")
        if not account:
            continue
        username = account["username"]
        if username not in seen_accounts:
            seen_accounts[username] = row["user_id"]

    results = []
    for username, user_id in seen_accounts.items():
        result = sync_account_for_user(user_id, username)
        results.append(result)

    success_count = sum(1 for r in results if r.get("success"))
    return {
        "total": len(results),
        "success": success_count,
        "failed": len(results) - success_count,
        "results": results,
    }
