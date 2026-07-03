from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import ensure_can_edit, get_current_user, require_role
from app.database import get_db
from app.models import Contract, Counteragent, Document, DocumentApproval, User
from app.schemas.contract import (
    ContractApprovalOut,
    ContractCreate,
    ContractOut,
    ContractUpdate,
    DocumentApprovalOut,
    SignerStatusOut,
)

router = APIRouter(
    prefix="/contracts", tags=["contracts"], dependencies=[Depends(get_current_user)]
)

CONTRACT_TAG = "Договор"


def _check_counteragent(db: Session, ca_id: int | None) -> None:
    if ca_id is not None and db.get(Counteragent, ca_id) is None:
        raise HTTPException(status_code=400, detail="Контрагент не найден")


def _resolve_users(db: Session, user_ids: list[int]) -> list[User]:
    if not user_ids:
        return []
    users = list(db.scalars(select(User).where(User.id.in_(user_ids))).all())
    if len(users) != len(set(user_ids)):
        raise HTTPException(status_code=400, detail="Некоторые пользователи не найдены")
    return users


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
        selectinload(Contract.counteragent),
        selectinload(Contract.documents),
        selectinload(Contract.participants),
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
def create_contract(
    payload: ContractCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role),
) -> Contract:
    _check_counteragent(db, payload.counteragent_id)
    data = payload.model_dump()
    doc_ids = data.pop("document_ids", [])
    participant_ids = data.pop("participant_ids", [])
    contract = Contract(**data, created_by_id=current.id)
    contract.documents = _resolve_documents(db, doc_ids)
    contract.participants = _resolve_users(db, participant_ids)
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.put("/{contract_id}", response_model=ContractOut)
def update_contract(
    contract_id: int,
    payload: ContractUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role),
) -> Contract:
    contract = db.get(Contract, contract_id)
    if contract is None:
        raise HTTPException(status_code=404, detail="Договор не найден")
    # Редактировать могут: автор, участники договора, администратор
    ensure_can_edit(
        current, contract.created_by_id, *(u.id for u in contract.participants)
    )
    _check_counteragent(db, payload.counteragent_id)
    data = payload.model_dump()
    doc_ids = data.pop("document_ids", [])
    participant_ids = data.pop("participant_ids", [])
    for field, value in data.items():
        setattr(contract, field, value)
    contract.documents = _resolve_documents(db, doc_ids)
    contract.participants = _resolve_users(db, participant_ids)
    db.commit()
    db.refresh(contract)
    return contract


@router.delete("/{contract_id}", status_code=204)
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role),
) -> None:
    contract = db.get(Contract, contract_id)
    if contract is None:
        raise HTTPException(status_code=404, detail="Договор не найден")
    # Удалять могут только автор и администратор
    ensure_can_edit(current, contract.created_by_id)
    db.delete(contract)
    db.commit()


# ---- Согласование (Задача 11) / Ознакомление (Задача 12) ----
KIND_APPROVAL = "approval"  # согласование — пользователи с флагом
KIND_ACK = "acknowledgement"  # ознакомление — участники


def _build_approval(db: Session, contract: Contract, current: User) -> ContractApprovalOut:
    # Согласующие — все пользователи с флагом «всегда в списке согласования».
    approvers = list(
        db.scalars(select(User).where(User.always_in_approval.is_(True))).all()
    )
    records = db.scalars(
        select(DocumentApproval).where(DocumentApproval.contract_id == contract.id)
    ).all()
    done = {(r.document_id, r.user_id, r.kind): r.approved_at for r in records}

    docs_out: list[DocumentApprovalOut] = []
    for d in contract.documents:
        appr = [
            SignerStatusOut(
                user=u,
                done=(d.id, u.id, KIND_APPROVAL) in done,
                at=done.get((d.id, u.id, KIND_APPROVAL)),
            )
            for u in approvers
        ]
        ack = [
            SignerStatusOut(
                user=u,
                done=(d.id, u.id, KIND_ACK) in done,
                at=done.get((d.id, u.id, KIND_ACK)),
            )
            for u in contract.participants
        ]
        docs_out.append(DocumentApprovalOut(document=d, approvers=appr, acknowledgers=ack))

    is_participant = any(u.id == current.id for u in contract.participants)
    # Ознакомился, если по всем документам есть отметка ознакомления текущего юзера.
    acknowledged = len(contract.documents) > 0 and all(
        (d.id, current.id, KIND_ACK) in done for d in contract.documents
    )
    return ContractApprovalOut(
        contract_id=contract.id,
        current_user_can_approve=current.always_in_approval,
        current_user_is_participant=is_participant,
        current_user_acknowledged=acknowledged,
        documents=docs_out,
    )


def _load_contract_full(db: Session, contract_id: int) -> Contract:
    contract = db.scalar(
        select(Contract)
        .where(Contract.id == contract_id)
        .options(selectinload(Contract.documents), selectinload(Contract.participants))
    )
    if contract is None:
        raise HTTPException(status_code=404, detail="Договор не найден")
    return contract


def _record_signoff(
    db: Session, contract_id: int, doc_id: int, user_id: int, kind: str
) -> None:
    existing = db.scalar(
        select(DocumentApproval).where(
            DocumentApproval.contract_id == contract_id,
            DocumentApproval.document_id == doc_id,
            DocumentApproval.user_id == user_id,
            DocumentApproval.kind == kind,
        )
    )
    if existing is None:
        db.add(
            DocumentApproval(
                contract_id=contract_id,
                document_id=doc_id,
                user_id=user_id,
                kind=kind,
            )
        )


@router.get("/{contract_id}/approvals", response_model=ContractApprovalOut)
def get_contract_approvals(
    contract_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> ContractApprovalOut:
    contract = _load_contract_full(db, contract_id)
    return _build_approval(db, contract, current)


@router.post(
    "/{contract_id}/documents/{doc_id}/approve", response_model=ContractApprovalOut
)
def approve_document(
    contract_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> ContractApprovalOut:
    """Согласование документа (Задача 12) — только пользователи с флагом."""
    contract = _load_contract_full(db, contract_id)
    if not current.always_in_approval:
        raise HTTPException(
            status_code=403,
            detail="Согласовывать могут только пользователи из списка согласования",
        )
    if not any(d.id == doc_id for d in contract.documents):
        raise HTTPException(status_code=400, detail="Документ не прикреплён к договору")
    _record_signoff(db, contract_id, doc_id, current.id, KIND_APPROVAL)
    db.commit()
    return _build_approval(db, contract, current)


@router.post("/{contract_id}/acknowledge", response_model=ContractApprovalOut)
def acknowledge_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> ContractApprovalOut:
    """Ознакомление со всеми документами (Задача 12) — только участники."""
    contract = _load_contract_full(db, contract_id)
    if not any(u.id == current.id for u in contract.participants):
        raise HTTPException(
            status_code=403, detail="Ознакомиться могут только участники договора"
        )
    for d in contract.documents:
        _record_signoff(db, contract_id, d.id, current.id, KIND_ACK)
    db.commit()
    return _build_approval(db, contract, current)
