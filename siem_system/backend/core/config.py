from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # InfluxDB settings
    influxdb_url: str
    influxdb_org: str
    influxdb_bucket: str
    influxdb_token: str

    # PostgreSQL settings
    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_host: str = "postgres"
    postgres_port: int = 5432

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    # jwt
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    class Config:
        env_file = ".env"


settings = Settings()
