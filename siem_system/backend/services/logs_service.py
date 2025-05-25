from fastapi import HTTPException
from databases.influxdb_client import get_query_api
from core.config import settings
from typing import Optional, List
import datetime


SEARCHABLE_FIELDS = ['message']


def format_value(val, field_type) -> str:
    if val is None:
        return 'null'
    # for bool
    if field_type == 'boolean':
        return str(val).lower()
    # for numeric
    if field_type == 'number':
        return str(float(val)) if '.' in str(val) else str(int(val))

    # for string
    esc = str(val).replace('\\', '\\\\').replace('"', '\\"')
    return f'"{esc}"'


async def fetch_fields(measurement):
    try:
        query_api = get_query_api()
        query = f'''
        import \"influxdata/influxdb/schema\"

        schema.fieldKeys(
          bucket: \"logs\",
          predicate: (r) => r[\"_measurement\"] == \"{measurement}\",
          start: 0
        )
        '''
        result = query_api.query(org=settings.influxdb_org, query=query)
        fields = []
        for table in result:
            for record in table.records:
                fields.append(record["_value"])
        return fields
    except Exception as e:
        print("Error in fetch_fields:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch fields")


async def fetch_measurements():
    try:
        query_api = get_query_api()
        query = f'''
        import \"influxdata/influxdb/schema\"
        schema.measurements(bucket: \"logs\")
        '''
        result = query_api.query(org=settings.influxdb_org, query=query)
        measurements = []
        for table in result:
            for record in table.records:
                measurements.append(record["_value"])
        return measurements
    except Exception as e:
        print("Error in fetch_measurements:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch measurements")


async def fetch_logs(
        limit: int,
        page: int,
        measurement: str,
        filters: List[dict],
        search_query: Optional[str] = None,
        sort_field: Optional[str] = None,
        sort_direction: str = "desc"
):
    try:
        offset = (page - 1) * limit
        query_api = get_query_api()
        needs_string_import = False
        search_added = False

        time_filter = None
        filtered_filters = []
        for f in filters:
            if f.get('field') == 'timestamp' and f.get('operator') == 'between':
                time_filter = f
            else:
                filtered_filters.append(f)

        # range
        if time_filter:
            start = f'time(v: "{time_filter["valueFrom"]}")'
            stop = f'time(v: "{time_filter["valueTo"]}")'
            range_line = f'  |> range(start: {start}, stop: {stop})\n'
        else:
            range_line = '  |> range(start: 0)\n'

        query = (
            f'from(bucket: "logs")\n'
            f'  {range_line}\n'
            f'  |> filter(fn: (r) => r["_measurement"] == "{measurement}")\n'
            f'  |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")'
        )

        # append each filter
        for flt in filtered_filters:
            condition = await get_flux_condition(flt, measurement)
            if condition:
                query += f'\n  |> filter(fn: (r) => {condition})'

                if flt.get("operator") in (
                        "contains", "ncontains",
                        "startsWith", "nstartsWith",
                        "endsWith", "nendsWith",
                        "containsAny", "ncontainsAny"
                ):
                    needs_string_import = True

        # add search if exists
        if search_query and search_query.strip():
            search_term = format_value(search_query.strip(), 'string')
            search_conditions = []

            for field in SEARCHABLE_FIELDS:
                search_conditions.append(
                    f'(exists r["{field}"] and '
                    f'strings.containsStr(v: strings.toLower(v: r["{field}"]), substr: {search_term}))'
                )

            if search_conditions:
                query += f'\n  |> filter(fn: (r) => {" or ".join(search_conditions)})'
                search_added = True

        if search_added or needs_string_import:
            query = f'import "strings"\n{query}'

        # sort
        if sort_field:
            sort_direction = 'true' if sort_direction.lower() == "desc" else "false"
            query += f'\n  |> sort(columns: ["{sort_field}"], desc: {sort_direction})'
        else:
            query += '\n  |> sort(columns: ["_time"], desc: true)'

        query += (
            f'\n  |> limit(n: {limit}, offset: {offset})'
            '\n  |> yield(name: "logs")'
        )

        result = query_api.query(org=settings.influxdb_org, query=query)
        logs = [record.values for table in result for record in table.records]
        return {"data": logs, "page": page, "limit": limit}

    except Exception as e:
        print("Error fetching logs:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch logs")


async def get_flux_condition(flt: dict, measurement: str) -> Optional[str]:
    field = flt.get("field")
    operator = flt.get("operator")
    value = flt.get("value")
    value_from = flt.get("valueFrom")
    value_to = flt.get("valueTo")
    field_type = await fetch_field_type(measurement, field)

    # exist / not exist
    if operator == "exists":
        return f'exists r["{field}"]'
    if operator == "nexists":
        return f'not exists r["{field}"]'

    # between / nbetween
    if operator in ("between", "nbetween"):
        low = format_value(value_from, field_type)
        high = format_value(value_to, field_type)

        if isinstance(low, (int, float)) and isinstance(high, (int, float)):
            condition = f'r["{field}"] >= {low} and r["{field}"] <= {high}'
        else:
            condition = f'r["{field}"] >= {low} and r["{field}"] <= {high}'

        if operator == "nbetween":
            condition = f'({condition})'
            return f'not {condition}'
        return condition

    # in / nin
    if operator in ("in", "nin"):
        items = value.split(",") if isinstance(value, str) else (value or [])
        formatted = [format_value(i.strip(), field_type) for i in items]
        if operator == "in":
            conds = " or ".join(f'r["{field}"] == {v}' for v in formatted)
        else:  # nin
            conds = " and ".join(f'r["{field}"] != {v}' for v in formatted)
        return f'({conds})'

    # containsAny / ncontainsAny
    if operator in ("containsAny", "ncontainsAny"):
        items = value.split(",") if isinstance(value, str) else (value or [])
        conds = [
            f'strings.containsStr(v: r["{field}"], substr: {format_value(i.strip(), field_type)})'
            for i in items
        ]
        joined = " or ".join(conds)
        return f'not ({joined})' if operator.startswith("n") else f'({joined})'

    # single‑value ops
    val = format_value(value, field_type)
    ops = {
        "eq": f'r["{field}"] == {val}',
        "neq": f'r["{field}"] != {val}',
        "contains": f'strings.containsStr(v: r["{field}"], substr: {val})',
        "ncontains": f'not strings.containsStr(v: r["{field}"], substr: {val})',
        "startsWith": f'strings.hasPrefix(v: r["{field}"], prefix: {val})',
        "nstartsWith": f'not strings.hasPrefix(v: r["{field}"], prefix: {val})',
        "endsWith": f'strings.hasSuffix(v: r["{field}"], suffix: {val})',
        "nendsWith": f'not strings.hasSuffix(v: r["{field}"], suffix: {val})',
    }
    return ops.get(operator)


async def fetch_values(measurement: str, field: str):
    try:
        query_api = get_query_api()
        query = f'''
        from(bucket: "logs")
          |> range(start: 0)
          |> filter(fn: (r) => r["_measurement"] == "{measurement}")
          |> filter(fn: (r) => r["_field"] == "{field}")
          |> keep(columns: ["_value"])
          |> distinct(column: "_value")
        '''
        result = query_api.query(org=settings.influxdb_org, query=query)
        values = [record.get_value() for table in result for record in table.records]
        return values
    except Exception as e:
        print("Error fetching values:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch values")


async def fetch_field_type(measurement: str, field: str):
    try:
        query_api = get_query_api()
        query = f'''
        from(bucket: "logs")
            |> range(start: -0)
            |> filter(fn: (r) => r._measurement == "{measurement}")
            |> filter(fn: (r) => r._field == "{field}")
            |> keep(columns: ["_value"])
            |> first()
            |> group()
            |> limit(n: 1)
        '''
        result = query_api.query(org=settings.influxdb_org, query=query)

        for table in result:
            for record in table.records:
                value = record.get_value()
                if isinstance(value, bool):
                    return "boolean"
                elif isinstance(value, datetime.datetime):
                    return "date"
                elif isinstance(value, (int, float)):
                    return "number"
                elif isinstance(value, str):
                    try:
                        datetime.datetime.fromisoformat(value)
                        return "date"
                    except (ValueError, TypeError):
                        return "string"
                else:
                    return "string"

        return "string"

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
