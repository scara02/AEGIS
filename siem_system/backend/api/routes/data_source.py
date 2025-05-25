from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from databases.psql import get_db
from services.data_source import (
    get_all_datasources, get_datasource_by_id, create_datasource, update_datasource, delete_datasource,
    update_datasources
)

from core.security import get_current_admin

router = APIRouter(prefix="/datasources", tags=["DataSources"])


@router.get("/")
async def list_datasources(
    search: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    sort_field: str = Query(None),
    sort_direction: str = Query('desc', regex='^(asc|desc)$'),
    db: AsyncSession = Depends(get_db)
):
    datasources, total = await get_all_datasources(db, search, page, limit, sort_field, sort_direction)
    return {"data": datasources, "total": total}


@router.get("/{id}")
async def read_datasource(id: int, db: AsyncSession = Depends(get_db)):
    datasource = await get_datasource_by_id(db, id)
    if not datasource:
        raise HTTPException(status_code=404, detail="DataSource not found")
    return datasource


@router.post("/", dependencies=[Depends(get_current_admin)])
async def create_new_datasource(datasource_data: dict, db: AsyncSession = Depends(get_db)):
    return await create_datasource(db, datasource_data)


@router.put("/{id}", dependencies=[Depends(get_current_admin)])
async def update_existing_datasource(id: int, update_data: dict, db: AsyncSession = Depends(get_db)):
    updated_datasource = await update_datasource(db, id, update_data)
    if not updated_datasource:
        raise HTTPException(status_code=404, detail="DataSource not found")
    return updated_datasource


@router.delete("/{id}", dependencies=[Depends(get_current_admin)])
async def delete_existing_datasource(id: int, db: AsyncSession = Depends(get_db)):
    deleted_datasource = await delete_datasource(db, id)
    if not deleted_datasource:
        raise HTTPException(status_code=404, detail="DataSource not found")
    return {"message": "DataSource deleted successfully"}


@router.post("/update-datasources")
async def update_datasources_all(db: AsyncSession = Depends(get_db)):
    return await update_datasources(db)
