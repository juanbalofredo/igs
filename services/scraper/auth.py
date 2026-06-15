import json
from datetime import date, datetime, timezone
from typing import Any

from instagrapi import Client
from instagrapi.exceptions import (
    BadPassword,
    ChallengeRequired,
    ClientError,
    LoginRequired,
    PleaseWaitFewMinutes,
    PrivateAccount,
    RecaptchaChallengeForm,
    TwoFactorRequired,
    UserNotFound,
)

from crypto_utils import decrypt_value, encrypt_value
from db import get_supabase


class AuthError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def _client_from_settings(settings_dict: dict[str, Any]) -> Client:
    client = Client()
    client.set_settings(settings_dict)
    return client


def login_with_credentials(username: str, password: str, verification_code: str | None = None) -> dict[str, Any]:
    username = username.strip().lstrip("@").lower()
    client = Client()
    client.delay_range = [1, 3]

    try:
        if verification_code:
            client.login(username, password, verification_code=verification_code)
        else:
            client.login(username, password)
    except TwoFactorRequired as exc:
        raise AuthError("two_factor_required", "Instagram requiere código de verificación en dos pasos") from exc
    except ChallengeRequired as exc:
        raise AuthError(
            "challenge_required",
            "Instagram detectó un inicio de sesión sospechoso. Abrí la app de Instagram, aprobá el acceso o completá la verificación, e intentá de nuevo.",
        ) from exc
    except RecaptchaChallengeForm as exc:
        raise AuthError(
            "challenge_required",
            "Instagram pide verificación extra. Entrá a la app de Instagram desde tu celular e intentá de nuevo.",
        ) from exc
    except PleaseWaitFewMinutes as exc:
        raise AuthError(
            "rate_limited",
            "Instagram pidió esperar unos minutos. Probá de nuevo más tarde.",
        ) from exc
    except BadPassword as exc:
        raise AuthError(
            "invalid_credentials",
            "Usuario o contraseña incorrectos. Si estás seguro de que son correctos, Instagram puede estar bloqueando el login desde el servidor.",
        ) from exc
    except ClientError as exc:
        message = str(exc)
        if "challenge" in message.lower():
            raise AuthError(
                "challenge_required",
                "Instagram requiere verificación de seguridad. Revisá la app de Instagram en tu celular.",
            ) from exc
        raise AuthError("login_failed", message) from exc
    except Exception as exc:
        raise AuthError("login_failed", str(exc)) from exc

    user_id = str(client.user_id)
    settings = client.get_settings()

    supabase = get_supabase()

    try:
        existing = supabase.table("users").select("id").eq("ig_username", username).limit(1).execute()

        if existing.data:
            user_id_db = existing.data[0]["id"]
            supabase.table("users").update({"ig_user_id": user_id}).eq("id", user_id_db).execute()
        else:
            inserted = supabase.table("users").insert({"ig_username": username, "ig_user_id": user_id}).execute()
            if not inserted.data:
                raise AuthError(
                    "database_error",
                    "No se pudo guardar el usuario. Ejecutá el SQL de migración en Supabase.",
                )
            user_id_db = inserted.data[0]["id"]

        encrypted = encrypt_value(json.dumps(settings))
        supabase.table("ig_sessions").upsert(
            {
                "user_id": user_id_db,
                "encrypted_session": encrypted,
                "expires_at": None,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        ).execute()
    except AuthError:
        raise
    except Exception as exc:
        raise AuthError(
            "database_error",
            f"Error de base de datos: {exc}. Verificá la Secret key de Supabase y que ejecutaste el SQL.",
        ) from exc

    return {
        "user_id": user_id_db,
        "ig_username": username,
        "ig_user_id": user_id,
    }


def get_client_for_user(user_id: str) -> Client:
    supabase = get_supabase()
    session_row = supabase.table("ig_sessions").select("encrypted_session").eq("user_id", user_id).maybe_single().execute()

    if not session_row.data:
        raise AuthError("session_missing", "No hay sesión de Instagram activa")

    settings_dict = json.loads(decrypt_value(session_row.data["encrypted_session"]))
    client = _client_from_settings(settings_dict)

    try:
        client.get_timeline_feed()
    except LoginRequired:
        raise AuthError("session_expired", "La sesión de Instagram expiró. Volvé a conectar tu cuenta") from None
    except ClientError:
        pass

    return client


def refresh_session(user_id: str, client: Client) -> None:
    supabase = get_supabase()
    encrypted = encrypt_value(json.dumps(client.get_settings()))
    supabase.table("ig_sessions").upsert(
        {
            "user_id": user_id,
            "encrypted_session": encrypted,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).execute()
