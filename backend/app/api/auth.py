from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import (
    generate_token,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models import EmailVerificationToken, User
from app.schemas.auth import LoginIn, MessageOut, RegisterIn, UserOut
from app.services.email import send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> MessageOut:
    """Регистрация: валидирует поля, создаёт пользователя и шлёт письмо-подтверждение."""
    login = payload.email.split("@", 1)[0].lower()

    # Уникальность email / логина
    existing = db.scalar(
        select(User).where((User.email == payload.email) | (User.login == login))
    )
    if existing is not None:
        # Нейтральное сообщение, чтобы не раскрывать существование аккаунта.
        return MessageOut(
            message="Если данные корректны, на почту отправлена ссылка для подтверждения."
        )

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        login=login,
        password_hash=hash_password(payload.password),
        is_email_verified=False,
        is_active=False,
    )
    db.add(user)
    db.flush()  # получить user.id

    token = EmailVerificationToken(
        user_id=user.id,
        token=generate_token(),
        expires_at=datetime.now(timezone.utc)
        + timedelta(hours=settings.EMAIL_TOKEN_TTL_HOURS),
    )
    db.add(token)
    db.commit()

    try:
        send_verification_email(user.email, user.full_name, token.token)
    except Exception as exc:  # SMTP недоступен — не валим регистрацию
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Не удалось отправить письмо: {exc}",
        ) from exc

    return MessageOut(
        message="Если данные корректны, на почту отправлена ссылка для подтверждения."
    )


@router.get("/verify", response_model=MessageOut)
def verify_email(
    token: str = Query(..., min_length=1), db: Session = Depends(get_db)
) -> MessageOut:
    """Подтверждение email по одноразовому токену из письма."""
    record = db.scalar(
        select(EmailVerificationToken).where(EmailVerificationToken.token == token)
    )
    if record is None:
        raise HTTPException(status_code=400, detail="Недействительная ссылка подтверждения")
    if record.used_at is not None:
        raise HTTPException(status_code=400, detail="Ссылка уже использована")

    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Срок действия ссылки истёк")

    record.used_at = datetime.now(timezone.utc)
    user = db.get(User, record.user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="Пользователь не найден")
    user.is_email_verified = True
    user.is_active = True
    db.commit()

    return MessageOut(message="Email подтверждён. Теперь вы можете войти.")


@router.post("/login", response_model=UserOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> User:
    """Заглушка входа (полноценная сессия/токены — в следующих задачах)."""
    user = db.scalar(select(User).where(User.login == payload.login.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    if not user.is_email_verified:
        raise HTTPException(status_code=403, detail="Email не подтверждён")
    return user
