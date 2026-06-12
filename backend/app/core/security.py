import re
import secrets

from passlib.context import CryptContext

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
