from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.associations import tag_categories


class Category(Base):
    """Категория тега (например: Даты, Сроки, Признаки)."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    tags: Mapped[list["Tag"]] = relationship(
        secondary=tag_categories, back_populates="categories"
    )
