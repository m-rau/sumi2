import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from api.config import settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, body_html: str, body_text: str) -> bool:
    """
    Send an email via SMTP.
    Returns True if sent successfully, False otherwise.
    """
    if not settings.smtp_host:
        logger.warning("SMTP not configured, skipping email send to %s", to)
        return False

    message = MIMEMultipart("alternative")
    message["From"] = settings.smtp_from
    message["To"] = to
    message["Subject"] = subject

    # Attach both plain text and HTML versions
    message.attach(MIMEText(body_text, "plain"))
    message.attach(MIMEText(body_html, "html"))

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_username or None,
            password=settings.smtp_password or None,
            start_tls=settings.smtp_use_tls,
        )
        logger.info("Email sent successfully to %s", to)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)
        return False


async def send_password_reset_email(email: str, reset_link: str) -> bool:
    """
    Send a password reset email.
    """
    subject = "Password Reset Request"

    body_text = f"""
Password Reset Request

You requested a password reset for your account.

Click the link below to reset your password:
{reset_link}

This link will expire in {settings.password_reset_expire_minutes} minutes.

If you did not request this reset, you can ignore this email.
"""

    body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
    <h2>Password Reset Request</h2>
    <p>You requested a password reset for your account.</p>
    <p>
        <a href="{reset_link}" style="display: inline-block; padding: 12px 24px; background-color: #f90; color: #000; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reset Password
        </a>
    </p>
    <p style="color: #666; font-size: 14px;">
        Or copy this link: <a href="{reset_link}">{reset_link}</a>
    </p>
    <p style="color: #666; font-size: 14px;">
        This link will expire in {settings.password_reset_expire_minutes} minutes.
    </p>
    <p style="color: #999; font-size: 12px;">
        If you did not request this reset, you can ignore this email.
    </p>
</body>
</html>
"""

    return await send_email(email, subject, body_html, body_text)
