from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.database import get_db
from app.models import Role, User
from app.schemas.auth import UserOut, UserRoleUpdate
from app.schemas.project import UserBrief

# Авторизация нужна для всего раздела; админ-доступ — на отдельных маршрутах.
router = APIRouter(
    prefix="/users", tags=["users"], dependencies=[Depends(get_current_user)]
)


@router.get("/brief", response_model=list[UserBrief])
def list_users_brief(db: Session = Depends(get_db)) -> list[User]:
    """Краткий список пользователей для выпадающих списков (руководитель,
    участники согласования). Доступен любому авторизованному."""
    return list(db.scalars(select(User).order_by(User.full_name)).all())


@router.get("", response_model=list[UserOut], dependencies=[Depends(require_admin)])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return list(db.scalars(select(User).order_by(User.id)).all())


@router.patch(
    "/{user_id}/role",
    response_model=UserOut,
    dependencies=[Depends(require_admin)],
)
def set_user_role(
    user_id: int, payload: UserRoleUpdate, db: Session = Depends(get_db)
) -> User:
    """Назначить/снять роль пользователю (только Администратор)."""
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if payload.role_id is not None and db.get(Role, payload.role_id) is None:
        raise HTTPException(status_code=400, detail="Роль не найдена")
    user.role_id = payload.role_id
    db.commit()
    db.refresh(user)
    return user
