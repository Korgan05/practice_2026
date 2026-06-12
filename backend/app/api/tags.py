from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models import Category, Tag
from app.models.associations import tag_categories
from app.schemas.storage import TagCategoriesUpdate, TagCreate, TagOut

router = APIRouter(
    prefix="/tags", tags=["tags"], dependencies=[Depends(get_current_user)]
)


def _load_categories(db: Session, category_ids: list[int]) -> list[Category]:
    if not category_ids:
        return []
    cats = list(db.scalars(select(Category).where(Category.id.in_(category_ids))).all())
    if len(cats) != len(set(category_ids)):
        raise HTTPException(status_code=400, detail="Некоторые категории не найдены")
    return cats


@router.get("", response_model=list[TagOut])
def list_tags(
    category_ids: list[int] | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[Tag]:
    """Список тегов. При указании category_ids — только теги, принадлежащие
    этим категориям (зависимость категория→теги при поиске, Задача 5)."""
    stmt = select(Tag)
    if category_ids:
        stmt = (
            stmt.join(tag_categories, Tag.id == tag_categories.c.tag_id)
            .where(tag_categories.c.category_id.in_(category_ids))
            .distinct()
        )
    return list(db.scalars(stmt.order_by(Tag.name)).all())


@router.post("", response_model=TagOut, status_code=201)
def create_tag(payload: TagCreate, db: Session = Depends(get_db)) -> Tag:
    name = payload.name.strip()
    if db.scalar(select(Tag).where(Tag.name == name)):
        raise HTTPException(status_code=409, detail="Тег с таким названием уже существует")
    tag = Tag(name=name, categories=_load_categories(db, payload.category_ids))
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.put("/{tag_id}/categories", response_model=TagOut)
def set_tag_categories(
    tag_id: int, payload: TagCategoriesUpdate, db: Session = Depends(get_db)
) -> Tag:
    tag = db.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="Тег не найден")
    tag.categories = _load_categories(db, payload.category_ids)
    db.commit()
    db.refresh(tag)
    return tag
