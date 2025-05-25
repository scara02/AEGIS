from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.alerts import Alert
from typing import List, Tuple
from datetime import datetime


async def get_all_alerts(
    db: AsyncSession,
    search: str = None,
    page: int = 1,
    limit: int = 10,
    sort_field: str = None,
    sort_direction: str = 'desc'
) -> Tuple[List[Alert], int]:
    query = select(Alert)

    if search:
        search = search.strip()
        conditions = []

        # text-based search for string columns
        conditions.extend([
            Alert.event_ids.ilike(f"%{search.lower()}%"),
            Alert.prediction.ilike(f"%{search.lower()}%"),
            Alert.source.ilike(f"%{search.lower()}%"),
            Alert.status.ilike(f"%{search.lower()}%"),
            Alert.raw_logs.ilike(f"%{search.lower()}%")
        ])

        # id-based search if the search query is a valid integer
        try:
            search_id = int(search)
            conditions.append(Alert.id == search_id)
        except ValueError:
            pass

        # combine conditions
        from sqlalchemy import or_
        query = query.where(or_(*conditions))

    if sort_field in ['id', 'event_ids', 'prediction', 'source', 'status', 'timestamp']:
        column = getattr(Alert, sort_field)
        query = query.order_by(column.asc() if sort_direction == 'asc' else column.desc())

    count_query = select(func.count()).select_from(Alert)
    if search:
        count_query = count_query.where(or_(*conditions))

    query = query.offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    count_result = await db.execute(count_query)

    alerts = result.scalars().all()
    total = count_result.scalar()

    return alerts, total


async def get_alert_by_id(db: AsyncSession, id: int):
    result = await db.execute(select(Alert).filter(Alert.id == id))
    return result.scalar_one_or_none()