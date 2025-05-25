import influxdb_client
from core.config import settings

client = influxdb_client.InfluxDBClient(
    url=settings.influxdb_url,
    token=settings.influxdb_token,
    org=settings.influxdb_org
)


def get_query_api():
    return client.query_api()
