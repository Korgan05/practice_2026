from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Конфигурация приложения, читается из .env."""

    DATABASE_URL: str = (
        "postgresql+psycopg2://practice:practice@localhost:5433/practice_2026"
    )

    # SMTP / MailHog
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "no-reply@practice2026.local"
    SMTP_USE_TLS: bool = False

    FRONTEND_URL: str = "http://localhost:5173"
    EMAIL_TOKEN_TTL_HOURS: int = 24

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
