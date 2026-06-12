from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.associations import document_tags, tag_categories


class Tag(Base):
    """Тег, который можно присвоить документу; принадлежит категориям (M:M)."""

    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    categories: Mapped[list["Category"]] = relationship(
        secondary=tag_categories, back_populates="tags"
    )
    documents: Mapped[list["Document"]] = relationship(
        secondary=document_tags, back_populates="tags"
    )
