from datetime import date

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


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RoleOut(BaseModel):
    id: int
    name: str
    description: str | None = None

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    login: str
    is_email_verified: bool
    is_active: bool
    role: RoleOut | None = None
    # Профиль (Задача 6)
    position: str | None = None
    department: str | None = None
    phone: str | None = None
    birth_date: date | None = None

    model_config = {"from_attributes": True}


class UserRoleUpdate(BaseModel):
    role_id: int | None = None


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=255)
    position: str | None = Field(default=None, max_length=150)
    department: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=50)
    birth_date: date | None = None
