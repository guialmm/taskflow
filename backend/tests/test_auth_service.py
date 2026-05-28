from datetime import datetime, timedelta

import pytest
from jose import JWTError, jwt

from app.config import settings
from app.services.auth import create_access_token, decode_token, hash_password, verify_password


def test_hash_password_is_not_plaintext():
    assert "mypassword" not in hash_password("mypassword")


def test_hash_password_returns_different_hash_each_time():
    assert hash_password("secret") != hash_password("secret")


def test_verify_password_correct():
    hashed = hash_password("mypassword")
    assert verify_password("mypassword", hashed) is True


def test_verify_password_wrong():
    hashed = hash_password("mypassword")
    assert verify_password("wrongpassword", hashed) is False


def test_create_access_token_contains_sub():
    token = create_access_token({"sub": "42"})
    payload = decode_token(token)
    assert payload["sub"] == "42"


def test_create_access_token_has_expiry():
    token = create_access_token({"sub": "1"})
    payload = decode_token(token)
    assert "exp" in payload


def test_decode_token_invalid_raises_jwt_error():
    with pytest.raises(JWTError):
        decode_token("not.a.valid.token")


def test_decode_token_expired_raises_jwt_error():
    expired_payload = {"sub": "1", "exp": datetime.utcnow() - timedelta(seconds=1)}
    token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    with pytest.raises(JWTError):
        decode_token(token)


def test_create_access_token_wrong_secret_raises():
    token = jwt.encode({"sub": "1"}, "wrong-secret", algorithm=settings.ALGORITHM)
    with pytest.raises(JWTError):
        decode_token(token)
