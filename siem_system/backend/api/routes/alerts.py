from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from databases.psql import get_db
from services.alerts import get_all_alerts, get_alert_by_id
from models.alerts import Alert
from pydantic import BaseModel
from typing import Literal

router = APIRouter(prefix="/alerts", tags=["alerts"])


class AlertStatusUpdate(BaseModel):
    status: Literal["Opened", "Closed", "Reopened", "In Progress"]


@router.get("/")
async def list_alerts(
        search: str = Query(None),
        page: int = Query(1, ge=1),
        limit: int = Query(10, ge=1, le=100),
        sort_field: str = Query(None),
        sort_direction: str = Query('desc', regex='^(asc|desc)$'),
        db: AsyncSession = Depends(get_db)
):
    alerts, total = await get_all_alerts(db, search, page, limit, sort_field, sort_direction)
    return {"data": alerts, "total": total}


@router.get("/{id}")
async def read_alert(id: int, db: AsyncSession = Depends(get_db)):
    alert = await get_alert_by_id(db, id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/{id}/status")
async def update_alert_status(
        id: int,
        status_update: AlertStatusUpdate,
        db: AsyncSession = Depends(get_db)
):
    alert = await get_alert_by_id(db, id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = status_update.status
    await db.commit()
    await db.refresh(alert)
    return alert
