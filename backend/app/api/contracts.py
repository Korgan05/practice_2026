from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.database import get_db
from app.models import Contract, Counteragent, Document
from app.schemas.contract import ContractCreate, ContractOut, ContractUpdate

router = APIRouter(
    prefix="/contracts", tags=["contracts"], dependencies=[Depends(get_current_user)]
)

CONTRACT_TAG = "Договор"


def _check_counteragent(db: Session, ca_id: int | None) -> None:
    if ca_id is not None and db.get(Counteragent, ca_id) is None:
        raise HTTPException(status_code=400, detail="Контрагент не найден")


def _resolve_documents(db: Session, doc_ids: list[int]) -> list[Document]:
    """Документы для прикрепления: должны существовать и иметь тег «Договор»."""
    if not doc_ids:
        return []
    docs = list(db.scalars(select(Document).where(Document.id.in_(doc_ids))).all())
    if len(docs) != len(set(doc_ids)):
        raise HTTPException(status_code=400, detail="Некоторые документы не найдены")
    for d in docs:
        if not any(t.name == CONTRACT_TAG for t in d.tags):
            raise HTTPException(
                status_code=400,
                detail=f"Документ «{d.original_filename}» не имеет тега «{CONTRACT_TAG}»",
            )
    return docs


@router.get("", response_model=list[ContractOut])
def list_contracts(
    q: str | None = Query(default=None, description="Поиск по номеру/предмету"),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[Contract]:
    stmt = select(Contract).options(
        selectinload(Contract.counteragent), selectinload(Contract.documents)
    )
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Contract.number.ilike(like), Contract.subject.ilike(like)))
    if status:
        stmt = stmt.where(Contract.status == status)
    return list(db.scalars(stmt.order_by(Contract.created_at.desc())).all())


@router.get("/{contract_id}", response_model=ContractOut)
def get_contract(contract_id: int, db: Session = Depends(get_db)) -> Contract:
    contract = db.get(Contract, contract_id)
    if contract is None:
        raise HTTPException(status_code=404, detail="Договор не найден")
    return contract


@router.post("", response_model=ContractOut, status_code=201)
def create_contract(payload: ContractCreate, db: Session = Depends(get_db)) -> Contract:
    _check_counteragent(db, payload.counteragent_id)
    data = payload.model_dump()
    doc_ids = data.pop("document_ids", [])
    contract = Contract(**data)
    contract.documents = _resolve_documents(db, doc_ids)
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.put("/{contract_id}", response_model=ContractOut)
def update_contract(
    contract_id: int, payload: ContractUpdate, db: Session = Depends(get_db)
) -> Contract:
    contract = db.get(Contract, contract_id)
    if contract is None:
        raise HTTPException(status_code=404, detail="Договор не найден")
    _check_counteragent(db, payload.counteragent_id)
    data = payload.model_dump()
    doc_ids = data.pop("document_ids", [])
    for field, value in data.items():
        setattr(contract, field, value)
    contract.documents = _resolve_documents(db, doc_ids)
    db.commit()
    db.refresh(contract)
    return contract


@router.delete("/{contract_id}", status_code=204)
def delete_contract(contract_id: int, db: Session = Depends(get_db)) -> None:
    contract = db.get(Contract, contract_id)
    if contract is None:
        raise HTTPException(status_code=404, detail="Договор не найден")
    db.delete(contract)
    db.commit()
