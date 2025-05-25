import httpx
import logging
from datetime import datetime
from core.config import settings
import json

logger = logging.getLogger(__name__)

class TelegramAlert:
    def __init__(self):
        self.enabled = bool(settings.telegram_bot_token and settings.telegram_chat_id)
        if self.enabled:
            logger.info("Telegram alerts enabled")
        else:
            logger.warning("Telegram credentials missing - alerts disabled")

    async def send_alert(self, event_ids: list, prediction: str, raw_logs: str, case_id: int, source: str, timestamp: datetime) -> bool:
        if not self.enabled:
            return False

        log_lines = raw_logs.split('\n')[:3]
        log_messages = []
        for line in log_lines:
            if not line.strip():
                continue
            try:
                log_entry = json.loads(line)
                message = log_entry.get("message", "No message field available")
                log_messages.append(message)
            except json.JSONDecodeError:
                continue

        message = (
            f"#Case{case_id}\n"
            f"Anomaly detected\n\n"
            f"Date: {timestamp.strftime('%Y-%m-%d %H:%M:%S %Z')}\n"
            f"Source: {source}\n\n"
            f"Event sequence: {', '.join(event_ids[:5])}{'...' if len(event_ids) > 5 else ''}\n"
            f"Logs:\n" + "\n\n".join(log_messages)
        )

        url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
        payload = {
            "chat_id": settings.telegram_chat_id,
            "text": message
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                logger.info("Telegram alert sent successfully")
                return True
        except Exception as e:
            logger.error(f"Failed to send Telegram alert: {str(e)}")
            return False
