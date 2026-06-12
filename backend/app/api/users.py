from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.database import get_db
from app.models import Role, User
from app.schemas.auth import UserOut, UserRoleUpdate

# Весь раздел доступен только Администратору (Задача 4 — пункт «Настройки»).
router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return list(db.scalars(select(User).order_by(User.id)).all())


@router.patch("/{user_id}/role", response_model=UserOut)
def set_user_role(
    user_id: int, payload: UserRoleUpdate, db: Session = Depends(get_db)
) -> User:
    """Назначить/снять роль пользователю."""
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if payload.role_id is not None and db.get(Role, payload.role_id) is None:
        raise HTTPException(status_code=400, detail="Роль не найдена")
    user.role_id = payload.role_id
    db.commit()
    db.refresh(user)
    return user
