from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.associations import document_tags


class Document(Base):
    """Загруженный файл и его метаданные."""

    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(150), nullable=True)
    size: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    uploaded_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    uploaded_by: Mapped["User | None"] = relationship()

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    tags: Mapped[list["Tag"]] = relationship(
        secondary=document_tags, back_populates="documents"
    )
