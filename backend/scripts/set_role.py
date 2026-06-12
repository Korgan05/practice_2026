"""Назначить роль пользователю (bootstrap первого Администратора).

Запуск из каталога backend:
    .venv\\Scripts\\python.exe -m scripts.set_role <email_или_login> <Роль>

Пример:
    .venv\\Scripts\\python.exe -m scripts.set_role ivanov@example.com Администратор
"""
import sys

# Корректный вывод кириллицы в консоли Windows (cp1252)
sys.stdout.reconfigure(encoding="utf-8")

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Role, User


def main() -> None:
    if len(sys.argv) != 3:
        print("Использование: python -m scripts.set_role <email|login> <Роль>")
        raise SystemExit(1)

    ident, role_name = sys.argv[1], sys.argv[2]
    login = ident.split("@", 1)[0].lower()

    with SessionLocal() as db:
        user = db.scalar(
            select(User).where((User.email == ident) | (User.login == login))
        )
        if user is None:
            print(f"Пользователь '{ident}' не найден")
            raise SystemExit(1)

        role = db.scalar(select(Role).where(Role.name == role_name))
        if role is None:
            names = ", ".join(r.name for r in db.scalars(select(Role)).all())
            print(f"Роль '{role_name}' не найдена. Доступные: {names}")
            raise SystemExit(1)

        user.role_id = role.id
        db.commit()
        print(f"OK: пользователю '{user.login}' назначена роль '{role.name}'")


if __name__ == "__main__":
    main()
