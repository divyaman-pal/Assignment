"""SMTP-based cold email sender with throttling, dry-run, and tracking."""
from __future__ import annotations
import smtplib
import ssl
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

from .. import config, db


class EmailSender:
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.host = config.env("SMTP_HOST", "smtp.gmail.com")
        self.port = int(config.env("SMTP_PORT", "587"))
        self.user = config.env("SMTP_USER", "")
        self.password = config.env("SMTP_PASSWORD", "")
        self.from_name = config.env("SMTP_FROM_NAME", "C-DISC Technologies")
        self.reply_to = config.env("SMTP_REPLY_TO", self.user)
        self.throttle = int(config.get("outreach.email.throttle_seconds", 8))

    def _connect(self):
        if self.dry_run:
            return None
        if not self.user or not self.password:
            raise RuntimeError("SMTP_USER / SMTP_PASSWORD not set in .env (use dry-run=True to test).")
        ctx = ssl.create_default_context()
        s = smtplib.SMTP(self.host, self.port, timeout=30)
        s.starttls(context=ctx)
        s.login(self.user, self.password)
        return s

    def _build(self, to_email: str, to_name: str, subject: str, body: str) -> MIMEMultipart:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = formataddr((self.from_name, self.user or "outreach@example.com"))
        msg["To"] = formataddr((to_name or "", to_email))
        msg["Reply-To"] = self.reply_to
        msg.attach(MIMEText(body, "plain", "utf-8"))
        # Naive HTML version: keep line breaks
        html = "<html><body>" + body.replace("\n", "<br/>") + "</body></html>"
        msg.attach(MIMEText(html, "html", "utf-8"))
        return msg

    def send_batch(self, batch_size: int = 25) -> dict:
        msgs = db.get_queued_messages(channel="email", batch=batch_size)
        sent = failed = skipped = 0
        s = self._connect()
        try:
            for m in msgs:
                to = m["lead_email"]
                if not to:
                    db.mark_message(m["id"], "failed", error="No email on lead")
                    skipped += 1
                    continue
                try:
                    built = self._build(to, m["lead_name"], m["subject"] or "", m["body"])
                    if self.dry_run:
                        print(f"  [DRY-RUN] to={to}  subject={m['subject']!r}")
                    else:
                        s.sendmail(self.user, [to], built.as_string())
                        print(f"  ✓ sent to {to}")
                    db.mark_message(m["id"], "sent")
                    sent += 1
                    time.sleep(self.throttle)
                except Exception as e:
                    db.mark_message(m["id"], "failed", error=str(e))
                    failed += 1
                    print(f"  ✗ failed for {to}: {e}")
        finally:
            if s:
                try: s.quit()
                except Exception: pass
        return {"sent": sent, "failed": failed, "skipped": skipped, "total": len(msgs)}
