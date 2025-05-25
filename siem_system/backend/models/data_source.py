import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from models.base import Base


class DataSource(Base):
    __tablename__ = "datasources"

    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    description = Column(String, nullable=True)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)

