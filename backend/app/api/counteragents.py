from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.deps import ensure_can_edit, get_current_user, require_role
from app.database import get_db
from app.models import Counteragent, User
from app.schemas.counteragent import (
    CounteragentCreate,
    CounteragentOut,
    CounteragentUpdate,
)

router = APIRouter(
    prefix="/counteragents",
    tags=["counteragents"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[CounteragentOut])
def list_counteragents(
    q: str | None = Query(default=None, description="Поиск по наименованию/ИНН"),
    db: Session = Depends(get_db),
) -> list[Counteragent]:
    stmt = select(Counteragent)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(Counteragent.name.ilike(like), Counteragent.inn_bin.ilike(like))
        )
    return list(db.scalars(stmt.order_by(Counteragent.name)).all())


@router.get("/{ca_id}", response_model=CounteragentOut)
def get_counteragent(ca_id: int, db: Session = Depends(get_db)) -> Counteragent:
    ca = db.get(Counteragent, ca_id)
    if ca is None:
        raise HTTPException(status_code=404, detail="Контрагент не найден")
    return ca


@router.post("", response_model=CounteragentOut, status_code=201)
def create_counteragent(
    payload: CounteragentCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role),
) -> Counteragent:
    ca = Counteragent(**payload.model_dump(), created_by_id=current.id)
    db.add(ca)
    db.commit()
    db.refresh(ca)
    return ca


@router.put("/{ca_id}", response_model=CounteragentOut)
def update_counteragent(
    ca_id: int,
    payload: CounteragentUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role),
) -> Counteragent:
    ca = db.get(Counteragent, ca_id)
    if ca is None:
        raise HTTPException(status_code=404, detail="Контрагент не найден")
    ensure_can_edit(current, ca.created_by_id)
    for field, value in payload.model_dump().items():
        setattr(ca, field, value)
    db.commit()
    db.refresh(ca)
    return ca


@router.delete("/{ca_id}", status_code=204)
def delete_counteragent(
    ca_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role),
) -> None:
    ca = db.get(Counteragent, ca_id)
    if ca is None:
        raise HTTPException(status_code=404, detail="Контрагент не найден")
    ensure_can_edit(current, ca.created_by_id)
    db.delete(ca)
    db.commit()
