from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import ensure_can_edit, get_current_user, require_role
from app.database import get_db
from app.models import Contract, Project, User
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate

router = APIRouter(
    prefix="/projects", tags=["projects"], dependencies=[Depends(get_current_user)]
)


def _check_manager(db: Session, manager_id: int | None) -> None:
    if manager_id is not None and db.get(User, manager_id) is None:
        raise HTTPException(status_code=400, detail="Руководитель не найден")


def _resolve_contracts(db: Session, contract_ids: list[int]) -> list[Contract]:
    if not contract_ids:
        return []
    contracts = list(
        db.scalars(select(Contract).where(Contract.id.in_(contract_ids))).all()
    )
    if len(contracts) != len(set(contract_ids)):
        raise HTTPException(status_code=400, detail="Некоторые договоры не найдены")
    return contracts


@router.get("", response_model=list[ProjectOut])
def list_projects(
    q: str | None = Query(default=None, description="Поиск по наименованию/коду"),
    db: Session = Depends(get_db),
) -> list[Project]:
    stmt = select(Project).options(
        selectinload(Project.manager), selectinload(Project.contracts)
    )
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Project.name.ilike(like), Project.code.ilike(like)))
    return list(db.scalars(stmt.order_by(Project.created_at.desc())).all())


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Проект не найден")
    return project


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role),
) -> Project:
    _check_manager(db, payload.manager_id)
    data = payload.model_dump()
    contract_ids = data.pop("contract_ids", [])
    project = Project(**data, created_by_id=current.id)
    project.contracts = _resolve_contracts(db, contract_ids)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role),
) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Проект не найден")
    # Редактировать могут: автор, руководитель проекта, администратор
    ensure_can_edit(current, project.created_by_id, project.manager_id)
    _check_manager(db, payload.manager_id)
    data = payload.model_dump()
    contract_ids = data.pop("contract_ids", [])
    for field, value in data.items():
        setattr(project, field, value)
    project.contracts = _resolve_contracts(db, contract_ids)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role),
) -> None:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Проект не найден")
    # Удалять могут только автор и администратор
    ensure_can_edit(current, project.created_by_id)
    db.delete(project)
    db.commit()
