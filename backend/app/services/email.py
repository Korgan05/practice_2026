import smtplib
from email.message import EmailMessage

from app.config import settings


def _send(to: str, subject: str, html_body: str, text_body: str) -> None:
    """Низкоуровневая отправка письма через SMTP (MailHog в dev)."""
    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text_body)
    msg.add_alternative(html_body, subtype="html")

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)


def send_verification_email(to: str, full_name: str, token: str) -> None:
    """Письмо со ссылкой подтверждения регистрации."""
    link = f"{settings.FRONTEND_URL}/verify?token={token}"
    subject = "Подтверждение регистрации — practice_2026"
    text_body = (
        f"Здравствуйте, {full_name}!\n\n"
        f"Для подтверждения регистрации перейдите по ссылке:\n{link}\n\n"
        f"Ссылка действительна {settings.EMAIL_TOKEN_TTL_HOURS} ч.\n"
        f"Если вы не регистрировались, просто проигнорируйте это письмо."
    )
    html_body = f"""\
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #222;">
      <p>Здравствуйте, <b>{full_name}</b>!</p>
      <p>Для подтверждения регистрации нажмите на кнопку:</p>
      <p>
        <a href="{link}"
           style="background:#2563eb;color:#fff;padding:10px 18px;
                  border-radius:6px;text-decoration:none;display:inline-block;">
          Подтвердить регистрацию
        </a>
      </p>
      <p>Или откройте ссылку вручную:<br><a href="{link}">{link}</a></p>
      <p style="color:#666;">Ссылка действительна {settings.EMAIL_TOKEN_TTL_HOURS} ч.
        Если вы не регистрировались, проигнорируйте это письмо.</p>
    </div>
    """
    _send(to, subject, html_body, text_body)
