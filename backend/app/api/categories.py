from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.database import get_db
from app.models import Category
from app.schemas.storage import CategoryCreate, CategoryOut

# Справочник доступен любому авторизованному; дополнять могут пользователи с ролью.
router = APIRouter(
    prefix="/categories",
    tags=["categories"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)) -> list[Category]:
    return list(db.scalars(select(Category).order_by(Category.name)).all())


@router.post(
    "", response_model=CategoryOut, status_code=201, dependencies=[Depends(require_role)]
)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)) -> Category:
    name = payload.name.strip()
    if db.scalar(select(Category).where(Category.name == name)):
        raise HTTPException(status_code=409, detail="Категория с таким названием уже существует")
    category = Category(name=name, description=payload.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category
