import re
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Требования к паролю: >= 8 символов, заглавные + строчные латинские буквы,
# цифры и спецсимволы.
MIN_PASSWORD_LENGTH = 8
_SPECIAL_CHARS = r"!@#$%^&*()_+\-=\[\]{};:'\",.<>/?\\|`~"


def validate_password(password: str) -> list[str]:
    """Возвращает список нарушений политики пароля (пустой список = пароль валиден)."""
    errors: list[str] = []
    if len(password) < MIN_PASSWORD_LENGTH:
        errors.append(f"Пароль должен содержать не менее {MIN_PASSWORD_LENGTH} символов")
    if not re.search(r"[A-Z]", password):
        errors.append("Пароль должен содержать заглавную латинскую букву")
    if not re.search(r"[a-z]", password):
        errors.append("Пароль должен содержать строчную латинскую букву")
    if not re.search(r"\d", password):
        errors.append("Пароль должен содержать цифру")
    if not re.search(f"[{_SPECIAL_CHARS}]", password):
        errors.append("Пароль должен содержать спецсимвол")
    return errors


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def generate_token() -> str:
    """Криптостойкий токен для ссылки подтверждения."""
    return secrets.token_urlsafe(32)


def create_access_token(subject: str | int) -> str:
    """JWT с идентификатором пользователя в поле sub."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Возвращает sub (id пользователя) или None, если токен недействителен."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload.get("sub")
    except jwt.PyJWTError:
        return None
