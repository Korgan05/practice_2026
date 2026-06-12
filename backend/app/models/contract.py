from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# Допустимые статусы договора
CONTRACT_STATUSES = ("draft", "active", "completed")


class Contract(Base):
    """Договор (Задача 8)."""

    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[str] = mapped_column(String(100), nullable=False)  # Номер
    subject: Mapped[str | None] = mapped_column(String(500), nullable=True)  # Предмет

    counteragent_id: Mapped[int | None] = mapped_column(
        ForeignKey("counteragents.id", ondelete="SET NULL"), nullable=True
    )
    counteragent: Mapped["Counteragent | None"] = relationship()

    amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    currency: Mapped[str | None] = mapped_column(String(10), nullable=True, default="KZT")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")

    conclusion_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    comment: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
