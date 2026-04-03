from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
import os

load_dotenv()  # reads your .env file

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./flowboard.db")

# connect_args is SQLite-specific — it allows multiple threads to use
# the same connection, which FastAPI needs since it handles requests concurrently
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# SessionLocal is a factory — calling SessionLocal() gives you a new session
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# Base is the parent class all our database models will inherit from
class Base(DeclarativeBase):
    pass

# This is a FastAPI "dependency" — a function that opens a session,
# yields it to the endpoint, then closes it when the request is done
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()