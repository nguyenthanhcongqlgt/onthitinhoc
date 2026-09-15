"""
Tiện ích mã hóa/giải mã dữ liệu nhạy cảm (API Key, Access Code).
Sử dụng Fernet symmetric encryption từ thư viện cryptography.
"""
import os
import base64
import hashlib
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


def _get_encryption_key() -> bytes:
    """
    Sinh Fernet key từ Django SECRET_KEY.
    Fernet yêu cầu key 32 bytes URL-safe base64 encoded.
    """
    secret = settings.SECRET_KEY.encode('utf-8')
    # Hash SECRET_KEY thành 32 bytes
    key_bytes = hashlib.sha256(secret).digest()
    return base64.urlsafe_b64encode(key_bytes)


def encrypt_value(plaintext: str) -> str:
    """Mã hóa chuỗi plaintext thành ciphertext (Fernet)."""
    if not plaintext or not plaintext.strip():
        return ''
    key = _get_encryption_key()
    f = Fernet(key)
    encrypted = f.encrypt(plaintext.encode('utf-8'))
    return encrypted.decode('utf-8')


def decrypt_value(ciphertext: str) -> str:
    """Giải mã ciphertext về plaintext. Trả về chuỗi rỗng nếu lỗi."""
    if not ciphertext or not ciphertext.strip():
        return ''
    key = _get_encryption_key()
    f = Fernet(key)
    try:
        decrypted = f.decrypt(ciphertext.encode('utf-8'))
        return decrypted.decode('utf-8')
    except (InvalidToken, Exception):
        # Nếu không giải mã được (dữ liệu cũ chưa mã hóa), trả về nguyên bản
        return ciphertext


def hash_access_code(code: str) -> str:
    """Hash mã truy cập đề thi bằng SHA-256 + salt từ SECRET_KEY."""
    if not code or not code.strip():
        return ''
    salt = settings.SECRET_KEY[:16]
    salted = f"{salt}:{code.strip()}"
    return hashlib.sha256(salted.encode('utf-8')).hexdigest()


def verify_access_code(code: str, stored_hash: str) -> bool:
    """So sánh timing-safe mã truy cập với hash đã lưu."""
    import hmac
    if not code or not stored_hash:
        return False
    computed = hash_access_code(code)
    return hmac.compare_digest(computed, stored_hash)
