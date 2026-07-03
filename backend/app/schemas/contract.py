from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.models.contract import CONTRACT_STATUSES
from app.schemas.project import UserBrief


class CounteragentBrief(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class DocumentBrief(BaseModel):
    id: int
    original_filename: str

    model_config = {"from_attributes": True}


class ContractBase(BaseModel):
    number: str = Field(..., min_length=1, max_length=100)
    subject: str | None = Field(default=None, max_length=500)
    counteragent_id: int | None = None
    amount: Decimal | None = None
    currency: str | None = Field(default="KZT", max_length=10)
    status: str = "draft"
    conclusion_date: date | None = None
    start_date: date | None = None
    end_date: date | None = None
    comment: str | None = Field(default=None, max_length=2000)

    @field_validator("status")
    @classmethod
    def check_status(cls, v: str) -> str:
        if v not in CONTRACT_STATUSES:
            raise ValueError(f"Недопустимый статус. Допустимы: {', '.join(CONTRACT_STATUSES)}")
        return v


class ContractCreate(ContractBase):
    document_ids: list[int] = Field(default_factory=list)
    participant_ids: list[int] = Field(default_factory=list)


class ContractUpdate(ContractBase):
    document_ids: list[int] = Field(default_factory=list)
    participant_ids: list[int] = Field(default_factory=list)


class ContractOut(ContractBase):
    id: int
    created_at: datetime
    created_by_id: int | None = None
    counteragent: CounteragentBrief | None = None
    documents: list[DocumentBrief] = Field(default_factory=list)
    participants: list[UserBrief] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# ---- Согласование (Задача 11) / Ознакомление (Задача 12) ----
class SignerStatusOut(BaseModel):
    user: UserBrief
    done: bool
    at: datetime | None = None


class DocumentApprovalOut(BaseModel):
    document: DocumentBrief
    approvers: list[SignerStatusOut]       # согласование (флаг-пользователи)
    acknowledgers: list[SignerStatusOut]   # ознакомление (участники)


class ContractApprovalOut(BaseModel):
    contract_id: int
    current_user_can_approve: bool         # имеет флаг «всегда в списке согласования»
    current_user_is_participant: bool
    current_user_acknowledged: bool        # ознакомился со всеми документами
    documents: list[DocumentApprovalOut]
