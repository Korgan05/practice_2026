import os
import uuid

from fastapi import UploadFile

from app.config import settings

# Разрешённые форматы (Задача 5): .doc, .xls, .pdf и архивы.
ALLOWED_EXTENSIONS: set[str] = {
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".pdf",
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
}


def get_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower()


def is_allowed(filename: str) -> bool:
    return get_extension(filename) in ALLOWED_EXTENSIONS


def upload_root() -> str:
    path = os.path.abspath(settings.UPLOAD_DIR)
    os.makedirs(path, exist_ok=True)
    return path


def save_upload(file: UploadFile) -> tuple[str, int]:
    """Сохраняет файл на диск под уникальным именем. Возвращает (stored_name, size)."""
    ext = get_extension(file.filename or "")
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(upload_root(), stored_name)

    size = 0
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    with open(dest, "wb") as out:
        while chunk := file.file.read(1024 * 1024):
            size += len(chunk)
            if size > max_bytes:
                out.close()
                os.remove(dest)
                raise ValueError(
                    f"Файл превышает максимальный размер {settings.MAX_UPLOAD_MB} МБ"
                )
            out.write(chunk)
    return stored_name, size


def stored_path(stored_filename: str) -> str:
    return os.path.join(upload_root(), stored_filename)
