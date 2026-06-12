# practice_2026

Учебный проект практики 2026 — клиент-серверное web-приложение
(документ/договор-менеджмент).

**Стек:** FastAPI + SQLAlchemy + Alembic (backend), React + Vite + TypeScript (frontend),
PostgreSQL и MailHog в Docker.

---

## Требования

- Python 3.11+
- Node.js 20+
- Docker Desktop (запущенный)

## Быстрый старт

### 1. Инфраструктура (PostgreSQL + MailHog)

```bash
docker compose up -d
docker compose ps
```

- PostgreSQL доступен на `localhost:5433` (user `practice`, pass `practice`, db `practice_2026`)
- MailHog web-интерфейс: http://localhost:8025

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env         # Linux/mac: cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

API + Swagger: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Приложение: http://localhost:5173

---

## Реализованные задачи

- **Задача 1** — репозиторий `practice_2026`.
- **Задача 2** — PostgreSQL в Docker с проброшенным портом `5433`.
- **Задача 3** — регистрация пользователя с подтверждением по email:
  поля ФИО / почтовый ящик (логин = часть до `@`) / пароль (политика сложности),
  кнопки «Регистрация» и «Отмена», письмо со ссылкой подтверждения (через MailHog).
- **Задача 4** — авторизация (JWT) и меню навигации с разграничением по ролям:
  «Основной раздел» → «Главная» (для всех); «Настройки» → «Пользователи», «Роли»
  (только для роли «Администратор»). Доступ закрыт и на фронте, и на бэке.
- **Задача 5** — система хранения файлов («Документы»): загрузка файлов
  (.doc/.xls/.pdf/архивы) с обязательными тегами; теги↔категории (M:M); пополняемый
  справочник тегов и категорий; поиск по тегам с зависимостью категория→теги
  (выбор категорий ограничивает список доступных тегов); скачивание файлов.
- **Задача 6** — расширенный профиль пользователя (страница «Профиль»): должность,
  подразделение, телефон, дата рождения. Просмотр и редактирование своих данных
  (`PATCH /api/auth/me`).
- **Задача 7** — справочник «Контрагенты» (создание/редактирование/удаление):
  наименование, ИНН/БИН, КПП, адрес, контактное лицо, телефон, email, банковские
  реквизиты; поиск по наименованию/ИНН (`/api/counteragents`).

## Назначение роли (bootstrap первого администратора)

После регистрации и подтверждения email пользователю можно назначить роль:

```bash
cd backend
.venv\Scripts\python.exe -m scripts.set_role <email_или_login> Администратор
```

Также администратор может менять роли пользователей на странице «Пользователи».

## Структура

```
practice_2026/
├── docker-compose.yml   # postgres + mailhog
├── backend/             # FastAPI приложение
└── frontend/            # React + Vite приложение
```
