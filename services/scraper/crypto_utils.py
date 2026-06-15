import base64
import hashlib

from cryptography.fernet import Fernet

from config import get_settings


def _fernet() -> Fernet:
    key = hashlib.sha256(get_settings()["encryption_key"].encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt_value(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt_value(value: str) -> str:
    return _fernet().decrypt(value.encode()).decode()
