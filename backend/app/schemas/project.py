from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from app.models.project import PROJECT_STATUSES


class UserBrief(BaseModel):
    id: int
    full_name: str

    model_config = {"from_attributes": True}


class ContractBrief(BaseModel):
    id: int
    number: str

    model_config = {"from_attributes": True}


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=2000)
    status: str = "planned"
    start_date: date | None = None
    end_date: date | None = None
    manager_id: int | None = None

    @field_validator("status")
    @classmethod
    def check_status(cls, v: str) -> str:
        if v not in PROJECT_STATUSES:
            raise ValueError(f"Недопустимый статус. Допустимы: {', '.join(PROJECT_STATUSES)}")
        return v


class ProjectCreate(ProjectBase):
    contract_ids: list[int] = Field(default_factory=list)


class ProjectUpdate(ProjectBase):
    contract_ids: list[int] = Field(default_factory=list)


class ProjectOut(ProjectBase):
    id: int
    created_at: datetime
    created_by_id: int | None = None
    manager: UserBrief | None = None
    contracts: list[ContractBrief] = Field(default_factory=list)

    model_config = {"from_attributes": True}
