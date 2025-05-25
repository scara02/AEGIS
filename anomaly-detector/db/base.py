from datetime import datetime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Text

Base = declarative_base()


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    event_ids = Column(Text, nullable=False)
    prediction = Column(String(50), nullable=False)
    source = Column(String(30), nullable=False)
    status = Column(String(15), nullable=False, default='Opened')
    timestamp = Column(DateTime, default=datetime.utcnow)
    raw_logs = Column(Text, nullable=False)

