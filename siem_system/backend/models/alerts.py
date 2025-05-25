from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from models.base import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    event_ids = Column(Text, nullable=False)
    prediction = Column(String(50), nullable=False)
    source = Column(String(30), nullable=False)
    status = Column(String(15), nullable=False, default='Opened')
    timestamp = Column(DateTime, default=datetime.utcnow)
    raw_logs = Column(Text, nullable=False)

