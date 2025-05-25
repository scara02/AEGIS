from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
from influxdb_client import InfluxDBClient
from core.config import settings
from databases.psql import get_db
import logging


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def check_postgresql(db: AsyncSession = Depends(get_db)) -> bool:
    try:
        await db.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"PostgreSQL connection failed: {str(e)}")
        return False


async def check_influxdb() -> bool:
    try:
        client = InfluxDBClient(
            url=settings.influxdb_url,
            token=settings.influxdb_token,
            org=settings.influxdb_org
        )
        ping_result = client.ping()
        return ping_result
    except Exception as e:
        logger.error(f"InfluxDB connection failed: {str(e)}")
        return False
