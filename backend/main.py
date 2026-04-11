from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import engine, Base
from routers import boards
from routers import ai
from routers.collaboration import router as collaboration_router

# Create all tables in the database on startup
# If the table already exists, this does nothing — it's safe to call every time
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FlowBoard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": "FlowBoard"}

# Register the boards router — all its endpoints now live under /boards
app.include_router(boards.router)
app.include_router(ai.router)
app.include_router(collaboration_router)