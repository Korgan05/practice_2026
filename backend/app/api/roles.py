from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.database import get_db
from app.models import Role
from app.schemas.auth import RoleOut

router = APIRouter(prefix="/roles", tags=["roles"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[RoleOut])
def list_roles(db: Session = Depends(get_db)) -> list[Role]:
    return list(db.scalars(select(Role).order_by(Role.id)).all())
