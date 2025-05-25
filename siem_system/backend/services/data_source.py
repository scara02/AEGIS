from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.config import settings
from databases.influxdb_client import get_query_api
from models.data_source import DataSource
from sqlalchemy.dialects.postgresql import insert as pg_insert
import datetime
from dateutil import parser
from typing import List, Tuple


async def get_all_datasources(
        db: AsyncSession,
        search: str = None,
        page: int = 1,
        limit: int = 10,
        sort_field: str = None,
        sort_direction: str = 'desc') -> Tuple[List[DataSource], int]:
    query = select(DataSource)
    if search:
        search = search.lower()
        query = query.where(
            (DataSource.name.ilike(f"%{search}%")) |
            (DataSource.ip.ilike(f"%{search}%")) |
            (DataSource.description.ilike(f"%{search}%"))
        )

    if sort_field:
        if sort_field in ['name', 'ip', 'description', 'last_seen']:
            column = getattr(DataSource, sort_field)
            query = query.order_by(column.asc() if sort_direction == 'asc' else column.desc())

    count_query = select(func.count()).select_from(DataSource)
    if search:
        count_query = count_query.where(
            (DataSource.name.ilike(f"%{search}%")) |
            (DataSource.ip.ilike(f"%{search}%")) |
            (DataSource.description.ilike(f"%{search}%"))
        )

    query = query.offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    count_result = await db.execute(count_query)

    datasources = result.scalars().all()
    total = count_result.scalar()

    return datasources, total


async def get_datasource_by_id(db: AsyncSession, id: int):
    result = await db.execute(select(DataSource).filter(DataSource.id == id))
    return result.scalar_one_or_none()


async def create_datasource(db: AsyncSession, datasource_data: dict):
    datasource = DataSource(**datasource_data)
    db.add(datasource)
    await db.commit()
    await db.refresh(datasource)
    return datasource


async def update_datasource(db: AsyncSession, id: int, update_data: dict):
    datasource = await get_datasource_by_id(db, id)
    if datasource:
        for key, value in update_data.items():
            if key == "last_seen" and isinstance(value, str):
                value = parser.parse(value).astimezone(datetime.timezone.utc).replace(tzinfo=None)
            setattr(datasource, key, value)
        await db.commit()
        await db.refresh(datasource)
    return datasource


async def delete_datasource(db: AsyncSession, id: int):
    datasource = await get_datasource_by_id(db, id)
    if datasource:
        await db.delete(datasource)
        await db.commit()
    return datasource


async def update_datasources(db: AsyncSession):
    try:
        query_api = get_query_api()

        query = '''
        from(bucket: "logs")
            |> range(start: 0)
            |> filter(fn: (r) => r._measurement == "log.hdfs" and r._field == "host_ip")
            |> group(columns: ["_value"])
            |> last()
        '''

        result = query_api.query(org=settings.influxdb_org, query=query)

        data = []
        for table in result:
            for record in table.records:
                host_ip = record.get_value()
                last_seen = record.get_time()

                if last_seen.tzinfo is not None:
                    last_seen = last_seen.astimezone(datetime.timezone.utc).replace(tzinfo=None)

                data.append({
                    "ip": host_ip,
                    "last_seen": last_seen
                })

        if data:
            stmt = pg_insert(DataSource).values(data)
            stmt = stmt.on_conflict_do_update(
                index_elements=['ip'],
                set_={
                    "last_seen": stmt.excluded.last_seen
                }
            )
            await db.execute(stmt)
            await db.commit()

        return {"status": "success", "updated_or_created": len(data)}
    except Exception as e:
        await db.rollback()
        raise e
