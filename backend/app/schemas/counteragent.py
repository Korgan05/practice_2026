from datetime import datetime

from pydantic import BaseModel, Field


class CounteragentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    inn_bin: str | None = Field(default=None, max_length=50)
    kpp: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=500)
    contact_person: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=255)
    bank_details: str | None = Field(default=None, max_length=1000)


class CounteragentCreate(CounteragentBase):
    pass


class CounteragentUpdate(CounteragentBase):
    pass


class CounteragentOut(CounteragentBase):
    id: int
    created_at: datetime
    created_by_id: int | None = None

    model_config = {"from_attributes": True}
