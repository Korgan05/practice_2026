from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# Вид подтверждения: согласование (Задача 11) / ознакомление (Задача 12)
APPROVAL_KINDS = ("approval", "acknowledgement")


class DocumentApproval(Base):
    """Подтверждение пользователем по документу в рамках договора."""

    __tablename__ = "document_approvals"
    __table_args__ = (
        UniqueConstraint(
            "contract_id", "document_id", "user_id", "kind",
            name="uq_document_approvals",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(
        ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False
    )
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[str] = mapped_column(String(20), nullable=False, default="approval")
    approved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship()
