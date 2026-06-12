from sqlalchemy import Column, ForeignKey, Table

from app.database import Base

# Теги <-> Категории (M:M)
tag_categories = Table(
    "tag_categories",
    Base.metadata,
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "category_id",
        ForeignKey("categories.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

# Документы <-> Теги (M:M)
document_tags = Table(
    "document_tags",
    Base.metadata,
    Column(
        "document_id",
        ForeignKey("documents.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

# Договоры <-> Документы (M:M, Задача 9)
contract_documents = Table(
    "contract_documents",
    Base.metadata,
    Column(
        "contract_id",
        ForeignKey("contracts.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "document_id",
        ForeignKey("documents.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

# Договоры <-> Участники (пользователи) (M:M, Задача 11)
contract_participants = Table(
    "contract_participants",
    Base.metadata,
    Column(
        "contract_id",
        ForeignKey("contracts.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "user_id",
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

# Проекты <-> Договоры (M:M, Задача 10)
project_contracts = Table(
    "project_contracts",
    Base.metadata,
    Column(
        "project_id",
        ForeignKey("projects.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "contract_id",
        ForeignKey("contracts.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
