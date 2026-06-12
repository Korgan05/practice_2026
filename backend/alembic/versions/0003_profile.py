"""profile fields: position, department, phone, birth_date

Revision ID: 0003_profile
Revises: 0002_storage
Create Date: 2026-06-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_profile"
down_revision: Union[str, None] = "0002_storage"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("position", sa.String(length=150), nullable=True))
    op.add_column("users", sa.Column("department", sa.String(length=150), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("birth_date", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "birth_date")
    op.drop_column("users", "phone")
    op.drop_column("users", "department")
    op.drop_column("users", "position")
