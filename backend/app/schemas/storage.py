from datetime import datetime

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None


class CategoryOut(BaseModel):
    id: int
    name: str
    description: str | None = None

    model_config = {"from_attributes": True}


class TagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category_ids: list[int] = Field(default_factory=list)


class TagCategoriesUpdate(BaseModel):
    category_ids: list[int] = Field(default_factory=list)


class TagOut(BaseModel):
    id: int
    name: str
    categories: list[CategoryOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class DocumentOut(BaseModel):
    id: int
    original_filename: str
    content_type: str | None = None
    size: int
    created_at: datetime
    uploaded_by: str | None = None
    tags: list[TagOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}
