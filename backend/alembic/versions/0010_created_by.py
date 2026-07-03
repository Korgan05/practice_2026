"""Автор записи (created_by) у контрагентов, договоров и проектов — права доступа.

Revision ID: 0010_created_by
Revises: 0009_approval_flag
Create Date: 2026-07-03
"""

import sqlalchemy as sa
from alembic import op

revision = "0010_created_by"
down_revision = "0009_approval_flag"
branch_labels = None
depends_on = None

TABLES = ("counteragents", "contracts", "projects")


def upgrade() -> None:
    for table in TABLES:
        op.add_column(
            table, sa.Column("created_by_id", sa.Integer(), nullable=True)
        )
        op.create_foreign_key(
            f"fk_{table}_created_by",
            table,
            "users",
            ["created_by_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    for table in TABLES:
        op.drop_constraint(f"fk_{table}_created_by", table, type_="foreignkey")
        op.drop_column(table, "created_by_id")
