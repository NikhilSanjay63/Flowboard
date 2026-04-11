from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from .connection_manager import manager
import json

router = APIRouter()

@router.websocket("/ws/{board_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, board_id: str, user_id: str):
    # Step 1: Accept and register this connection
    await manager.connect(websocket, board_id, user_id)

    try:
        while True:
            # Step 2: Wait for any message from this client
            data = await websocket.receive_text()
            message = json.loads(data)

            # Step 3: Attach sender info and broadcast to others
            message["sender_id"] = user_id
            await manager.broadcast(message, board_id, websocket)

    except WebSocketDisconnect:
        # Step 4: Clean up when tab closes or connection drops
        manager.disconnect(websocket, board_id, user_id)
        
        # Notify others that this user left (so their cursor disappears)
        await manager.broadcast(
            {"type": "user_left", "sender_id": user_id},
            board_id,
            websocket  # sender is already gone, so no one gets skipped
        )