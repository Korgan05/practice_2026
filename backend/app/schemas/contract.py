from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.models.contract import CONTRACT_STATUSES


class CounteragentBrief(BaseModel):
    id: int
    name: str

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
    pass


class ContractUpdate(ContractBase):
    pass


class ContractOut(ContractBase):
    id: int
    created_at: datetime
    counteragent: CounteragentBrief | None = None

    model_config = {"from_attributes": True}
