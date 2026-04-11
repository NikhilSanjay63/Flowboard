from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        # Key: board_id (str), Value: list of active WebSocket connections
        self.active_rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, board_id: str, user_id: str):
        await websocket.accept()
        if board_id not in self.active_rooms:
            self.active_rooms[board_id] = []
        self.active_rooms[board_id].append(websocket)
        print(f"[WS] User {user_id} joined board {board_id}. "
              f"Total in room: {len(self.active_rooms[board_id])}")

    def disconnect(self, websocket: WebSocket, board_id: str, user_id: str):
        if board_id in self.active_rooms:
            self.active_rooms[board_id].remove(websocket)
            print(f"[WS] User {user_id} left board {board_id}. "
                  f"Remaining: {len(self.active_rooms[board_id])}")

    async def broadcast(self, message: dict, board_id: str, sender: WebSocket):
        """Send a message to everyone in the room EXCEPT the sender."""
        import json
        if board_id not in self.active_rooms:
            return
        for connection in self.active_rooms[board_id]:
            if connection is not sender:
                await connection.send_text(json.dumps(message))

# Single shared instance — imported everywhere it's needed
manager = ConnectionManager()