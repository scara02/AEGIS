from fastapi import APIRouter, HTTPException, Query
from services.logs_service import fetch_logs, fetch_fields, fetch_measurements, fetch_values, fetch_field_type
from typing import Optional
import json

router = APIRouter()


@router.get("/logs")
async def get_logs(
        limit: int = Query(10, gt=0),
        page: int = Query(1, gt=0),
        measurement: str = Query(...),
        filters: Optional[str] = Query(None),
        q: Optional[str] = Query(None),
        sort_field: Optional[str] = Query(None),
        sort_direction: str = "desc"
):
    filter_list = []
    if filters:
        try:
            filter_list = json.loads(filters)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid filters format")

    logs = await fetch_logs(limit, page, measurement, filter_list, q, sort_field, sort_direction)
    return logs


@router.get("/fields")
async def get_fields(measurement: str = Query(...)):
    try:
        fields = await fetch_fields(measurement)
        return fields
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/measurements")
async def get_measurements():
    try:
        measurements = await fetch_measurements()
        return measurements
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# fetch values fro specific field
@router.get("/values")
async def get_values(measurement: str, field: str):
    values = await fetch_values(measurement, field)
    return values


@router.get("/field-type")
async def get_field_type(measurement: str, field: str):
    field_type = await fetch_field_type(measurement, field)
    return field_type
