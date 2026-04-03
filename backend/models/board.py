from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime, timezone
from database.db import Base

class Board(Base):
    __tablename__ = "boards"  # this becomes the actual table name in SQLite

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)

    # canvas_state stores the full Fabric.js JSON as a string
    # Text column has no length limit — important since canvas JSON can be large
    canvas_state = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime,
                        default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))