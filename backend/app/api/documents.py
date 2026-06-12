import os

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
)
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.database import get_db
from app.models import Document, Tag, User
from app.models.associations import document_tags
from app.schemas.storage import DocumentOut
from app.services import storage

router = APIRouter(
    prefix="/documents", tags=["documents"], dependencies=[Depends(get_current_user)]
)


def _to_out(doc: Document) -> DocumentOut:
    return DocumentOut(
        id=doc.id,
        original_filename=doc.original_filename,
        content_type=doc.content_type,
        size=doc.size,
        created_at=doc.created_at,
        uploaded_by=doc.uploaded_by.login if doc.uploaded_by else None,
        tags=doc.tags,  # type: ignore[arg-type]  # валидируется from_attributes
    )


@router.get("", response_model=list[DocumentOut])
def search_documents(
    tag_ids: list[int] | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[DocumentOut]:
    """Поиск документов по тегам (если теги не заданы — все документы)."""
    stmt = select(Document).options(
        selectinload(Document.tags).selectinload(Tag.categories),
        selectinload(Document.uploaded_by),
    )
    if tag_ids:
        stmt = (
            stmt.join(document_tags, Document.id == document_tags.c.document_id)
            .where(document_tags.c.tag_id.in_(tag_ids))
            .distinct()
        )
    docs = db.scalars(stmt.order_by(Document.created_at.desc())).all()
    return [_to_out(d) for d in docs]


@router.post("", response_model=DocumentOut, status_code=201)
def upload_document(
    file: UploadFile = File(...),
    tag_ids: str = Form(..., description="ID тегов через запятую"),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> DocumentOut:
    # Валидация формата
    if not storage.is_allowed(file.filename or ""):
        allowed = ", ".join(sorted(storage.ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"Недопустимый формат файла. Разрешены: {allowed}",
        )

    # Теги обязательны при загрузке (Задача 5)
    ids = [int(x) for x in tag_ids.split(",") if x.strip().isdigit()]
    if not ids:
        raise HTTPException(status_code=400, detail="Укажите хотя бы один тег")
    tags = list(db.scalars(select(Tag).where(Tag.id.in_(ids))).all())
    if len(tags) != len(set(ids)):
        raise HTTPException(status_code=400, detail="Некоторые теги не найдены")

    try:
        stored_name, size = storage.save_upload(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    doc = Document(
        original_filename=file.filename or stored_name,
        stored_filename=stored_name,
        content_type=file.content_type,
        size=size,
        uploaded_by_id=current.id,
        tags=tags,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _to_out(doc)


@router.get("/{doc_id}/download")
def download_document(doc_id: int, db: Session = Depends(get_db)) -> FileResponse:
    doc = db.get(Document, doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Документ не найден")
    path = storage.stored_path(doc.stored_filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Файл отсутствует на диске")
    return FileResponse(
        path,
        filename=doc.original_filename,
        media_type=doc.content_type or "application/octet-stream",
    )
