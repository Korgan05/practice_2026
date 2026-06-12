from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.security import validate_password


class RegisterIn(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="ФИО")
    email: EmailStr
    password: str

    @field_validator("full_name")
    @classmethod
    def full_name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("ФИО обязательно для заполнения")
        return v

    @field_validator("password")
    @classmethod
    def password_policy(cls, v: str) -> str:
        errors = validate_password(v)
        if errors:
            raise ValueError("; ".join(errors))
        return v


class LoginIn(BaseModel):
    login: str
    password: str


class MessageOut(BaseModel):
    message: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    login: str
    is_email_verified: bool
    is_active: bool

    model_config = {"from_attributes": True}
