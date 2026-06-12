from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models import User

# tokenUrl нужен только для Swagger-кнопки Authorize
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

ADMIN_ROLE = "Администратор"


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Недействительный токен",
        headers={"WWW-Authenticate": "Bearer"},
    )
    sub = decode_access_token(token)
    if sub is None:
        raise cred_exc
    user = db.get(User, int(sub))
    if user is None or not user.is_active:
        raise cred_exc
    return user


def require_admin(current: User = Depends(get_current_user)) -> User:
    if current.role is None or current.role.name != ADMIN_ROLE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Требуется роль «Администратор»",
        )
    return current
