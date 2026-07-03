from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Counteragent(Base):
    """Контрагент (Задача 7)."""

    __tablename__ = "counteragents"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)  # Наименование
    inn_bin: Mapped[str | None] = mapped_column(String(50), nullable=True)  # ИНН/БИН
    kpp: Mapped[str | None] = mapped_column(String(50), nullable=True)  # КПП
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)  # Адрес
    contact_person: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bank_details: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Автор записи — для контроля прав редактирования
    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_by: Mapped["User | None"] = relationship()

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
