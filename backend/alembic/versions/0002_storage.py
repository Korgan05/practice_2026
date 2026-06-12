"""storage: categories, tags, documents + M:M (+ seed categories)

Revision ID: 0002_storage
Revises: 0001_initial
Create Date: 2026-06-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_storage"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SEED_CATEGORIES = [
    ("Даты", "Календарные даты документа"),
    ("Сроки", "Сроки и дедлайны"),
    ("Признаки", "Прочие признаки и метки"),
]


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.UniqueConstraint("name", name="uq_categories_name"),
    )

    op.create_table(
        "tags",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.UniqueConstraint("name", name="uq_tags_name"),
    )

    op.create_table(
        "tag_categories",
        sa.Column("tag_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("tag_id", "category_id"),
    )

    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("stored_filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=150), nullable=True),
        sa.Column("size", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("uploaded_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["uploaded_by_id"], ["users.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "document_tags",
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("tag_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("document_id", "tag_id"),
    )

    categories = sa.table(
        "categories",
        sa.column("name", sa.String),
        sa.column("description", sa.String),
    )
    op.bulk_insert(
        categories, [{"name": n, "description": d} for n, d in SEED_CATEGORIES]
    )


def downgrade() -> None:
    op.drop_table("document_tags")
    op.drop_table("documents")
    op.drop_table("tag_categories")
    op.drop_table("tags")
    op.drop_table("categories")
