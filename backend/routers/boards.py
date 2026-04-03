from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database.db import get_db
from models.board import Board

router = APIRouter(prefix="/boards", tags=["boards"])

# --- Pydantic schemas ---
# These define what JSON shape the API accepts and returns
# They are separate from the SQLAlchemy model (which defines the DB table)

class BoardCreate(BaseModel):
    name: str
    canvas_state: Optional[str] = None

class BoardUpdate(BaseModel):
    name: Optional[str] = None
    canvas_state: Optional[str] = None

class BoardResponse(BaseModel):
    id: int
    name: str
    canvas_state: Optional[str] = None

    class Config:
        from_attributes = True  # lets Pydantic read SQLAlchemy objects directly


# --- Endpoints ---

# POST /boards — create a new board
@router.post("/", response_model=BoardResponse)
def create_board(payload: BoardCreate, db: Session = Depends(get_db)):
    board = Board(name=payload.name, canvas_state=payload.canvas_state)
    db.add(board)
    db.commit()
    db.refresh(board)  # reload from DB so we get the generated id
    return board


# GET /boards — list all boards (just id and name, no canvas_state)
@router.get("/", response_model=list[BoardResponse])
def list_boards(db: Session = Depends(get_db)):
    return db.query(Board).all()


# GET /boards/{board_id} — get one board with full canvas_state
@router.get("/{board_id}", response_model=BoardResponse)
def get_board(board_id: int, db: Session = Depends(get_db)):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


# PUT /boards/{board_id} — update name or canvas_state
@router.put("/{board_id}", response_model=BoardResponse)
def update_board(board_id: int, payload: BoardUpdate, db: Session = Depends(get_db)):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    if payload.name is not None:
        board.name = payload.name
    if payload.canvas_state is not None:
        board.canvas_state = payload.canvas_state
    db.commit()
    db.refresh(board)
    return board