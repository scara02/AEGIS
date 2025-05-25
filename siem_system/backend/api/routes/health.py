from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from databases.psql import get_db
from services.health import check_influxdb, check_postgresql

router = APIRouter()


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    influxdb_status = await check_influxdb()
    postgresql_status = await check_postgresql(db)

    return {
        "influxdb": influxdb_status,
        "postgresql": postgresql_status
    }
