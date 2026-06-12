"""contract_documents M:M + seed tag «Договор»

Revision ID: 0006_contract_documents
Revises: 0005_contracts
Create Date: 2026-06-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006_contract_documents"
down_revision: Union[str, None] = "0005_contracts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "contract_documents",
        sa.Column("contract_id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["contract_id"], ["contracts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("contract_id", "document_id"),
    )
    # Гарантируем наличие тега «Договор» (Задача 9)
    op.execute(
        "INSERT INTO tags (name) VALUES ('Договор') "
        "ON CONFLICT (name) DO NOTHING"
    )


def downgrade() -> None:
    op.drop_table("contract_documents")
