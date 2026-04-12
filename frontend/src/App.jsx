import { useState, useEffect, useRef } from "react";
import Canvas from "./components/Canvas";
import Toolbar from "./components/Toolbar";
import KanbanBoard from "./components/KanbanBoard";
import AIDiagram from "./components/AIDiagram";
import LandingPage from "./components/LandingPage";


// Generates a consistent color from a user ID string
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 45%)`;
}


function App() {
  const [session, setSession] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [clearFlag, setClearFlag] = useState(0);
  const [undoFlag, setUndoFlag] = useState(0);
  const [redoFlag, setRedoFlag] = useState(0);
  const deleteSelectedRef = useRef(null);

  // Image import
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setImageFile(file);
  };

  // PNG export
  const exportCanvasRef = useRef(null);

  const handleExportPNG = () => {
    if (exportCanvasRef.current) exportCanvasRef.current();
  };

  // PDF export
  const exportPDFRef = useRef(null);

  const handleExportPDF = () => {
  if (exportPDFRef.current) exportPDFRef.current();
};

// PPTX export
const exportPPTXRef = useRef(null);

const handleExportPPTX = () => {
  if (exportPPTXRef.current) exportPPTXRef.current();
};

const getCanvasJSONRef = useRef(null);

const handleSaveBoard = async () => {
  if (!getCanvasJSONRef.current) return;

  const canvasJSON = getCanvasJSONRef.current();
  const boardName = `FlowBoard Save — ${new Date().toLocaleString()}`;

  try {
    const response = await fetch("http://localhost:8000/boards/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: boardName, canvas_state: canvasJSON }),
    });

    const data = await response.json();
    alert(`Board saved! ID: ${data.id}`);
    localStorage.setItem("flowboard_last_id", data.id);
  } catch (err) {
    alert("Save failed. Is the backend running?");
    console.error(err);
  }
};

const loadCanvasJSONRef = useRef(null);

const handleLoadBoard = async () => {
  const id = localStorage.getItem("flowboard_last_id");
  if (!id) {
    alert("No saved board found. Save a board first!");
    return;
  }

  try {
    const response = await fetch(`http://localhost:8000/boards/${id}`);
    const data = await response.json();

    if (!loadCanvasJSONRef.current) return;
    await loadCanvasJSONRef.current(data.canvas_state);
    alert("Board loaded successfully!");
  } catch (err) {
    alert("Load failed. Is the backend running?");
    console.error(err);
  }
};

const [showAI, setShowAI] = useState(false);

const insertDiagramRef = useRef(null);

const [isKanbanOpen, setIsKanbanOpen] = useState(false);

const [kanbanColumns, setKanbanColumns] = useState([
  {
    id: "col-1",
    title: "To Do",
    cards: [
      { id: "card-1", text: "Design the homepage" },
      { id: "card-2", text: "Set up database" },
    ],
  },
  {
    id: "col-2",
    title: "In Progress",
    cards: [
      { id: "card-3", text: "Build Kanban board" },
    ],
  },
  {
    id: "col-3",
    title: "Done",
    cards: [],
  },
]);

// Stable user ID for this browser session
const userId = session?.displayName;

// The WebSocket connection
const wsRef = useRef(null);

// Track other users' cursors: { user_id: { x, y, label } }
const [remoteCursors, setRemoteCursors] = useState({});

// Connect to WebSocket when app loads
useEffect(() => {
  if (!session) return;
  const boardId = session.boardId; // hardcoded for now, one shared room
  const ws = new WebSocket(
    `ws://localhost:8000/ws/${boardId}/${session.displayName}`
  );

  ws.onopen = () => {
    console.log('[WS] Connected to FlowBoard collaboration server');
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleIncomingMessage(message);
  };

  ws.onclose = () => {
    console.log('[WS] Disconnected');
  };

  ws.onerror = (err) => {
    console.error('[WS] Error:', err);
  };

  wsRef.current = ws;

  // Clean up when component unmounts
  return () => {
    ws.close();
  };
}, [session]); // Re-run effect if session changes (e.g. user joins a different board)

const sendToCanvasRef = useRef(null);
const canvasRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        setUndoFlag((f) => f + 1);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        setRedoFlag((f) => f + 1);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (deleteSelectedRef.current) deleteSelectedRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Adds a new card to the column with the given columnId
function addCard(columnId) {
  const text = prompt("Enter card text:");
  if (!text || text.trim() === "") return; // do nothing if cancelled or empty

  const newCard = {
    id: "card-" + Date.now(), // unique ID using timestamp
    text: text.trim(),
  };

  setKanbanColumns((prevColumns) =>
    prevColumns.map((col) =>
      col.id === columnId
        ? { ...col, cards: [...col.cards, newCard] } // add card to matching column
        : col // leave other columns untouched
    )
  );
}

// Deletes the card with cardId from the column with columnId
function deleteCard(columnId, cardId) {
  setKanbanColumns((prevColumns) =>
    prevColumns.map((col) =>
      col.id === columnId
        ? { ...col, cards: col.cards.filter((card) => card.id !== cardId) }
        : col
    )
  );
}

function moveCard(cardId, fromColumnId, toColumnId) {
  if (fromColumnId === toColumnId) return; // dropped in same column, do nothing

  setKanbanColumns((prevColumns) => {
    // Find the card object we're moving
    const fromColumn = prevColumns.find((col) => col.id === fromColumnId);
    const cardToMove = fromColumn.cards.find((card) => card.id === cardId);

    return prevColumns.map((col) => {
      if (col.id === fromColumnId) {
        // Remove the card from its original column
        return { ...col, cards: col.cards.filter((card) => card.id !== cardId) };
      }
      if (col.id === toColumnId) {
        // Add the card to the destination column
        return { ...col, cards: [...col.cards, cardToMove] };
      }
      return col; // all other columns untouched
    });
  });
}

function addColumn() {
  const title = prompt("Enter column title:");
  if (!title || title.trim() === "") return;

  const newColumn = {
    id: "col-" + Date.now(),
    title: title.trim(),
    cards: [],
  };

  setKanbanColumns((prev) => [...prev, newColumn]);
}

function deleteColumn(columnId) {
  setKanbanColumns((prev) => prev.filter((col) => col.id !== columnId));
}

function handleIncomingMessage(message) {
  console.log('[WS] Incoming message:', message.type)

  if (message.type === 'cursor_move') {
    // Update the remote cursor position for this user
    setRemoteCursors(prev => ({
      ...prev,
      [message.sender_id]: { x: message.x, y: message.y, label: message.sender_id }
    }));
  }

  if (message.type === 'user_left') {
    // Remove their cursor when they disconnect
    setRemoteCursors(prev => {
      const updated = { ...prev };
      delete updated[message.sender_id];
      return updated;
    });
  }

  if (message.type === 'canvas_update') {
  canvasRef.current?.applyRemoteUpdate(message.canvasJSON);
}
}

if (!session) {
  return <LandingPage onJoin={(s) => setSession(s)} />;
}

  return (
    <div style={{ margin: 0, padding: 0, overflow: "hidden" }}>
      {/* Hidden file input for image import */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />


      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        color={color}
        onColorChange={setColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        onClear={() => setClearFlag((f) => f + 1)}
        onUndo={() => setUndoFlag((f) => f + 1)}
        onRedo={() => setRedoFlag((f) => f + 1)}
        onImportImage={() => fileInputRef.current.click()}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
        onExportPPTX={handleExportPPTX}
        showKanban={isKanbanOpen}
        onToggleKanban={() => setIsKanbanOpen(prev => !prev)}
        onSaveBoard={handleSaveBoard}
        onLoadBoard={handleLoadBoard}
        showAI={showAI}
        onToggleAI={() => setShowAI(prev => !prev)}
        boardName={session.boardName}
      />
     <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
  <Canvas
    activeTool={activeTool}
    color={color}
    strokeWidth={strokeWidth}
    clearFlag={clearFlag}
    undoFlag={undoFlag}
    redoFlag={redoFlag}
    deleteSelectedRef={deleteSelectedRef}
    imageFile={imageFile}
    exportCanvasRef={exportCanvasRef}
    exportPDFRef={exportPDFRef}
    exportPPTXRef={exportPPTXRef}
    sendToCanvasRef={sendToCanvasRef}
    getCanvasJSONRef={getCanvasJSONRef}
    loadCanvasJSONRef={loadCanvasJSONRef}
    insertDiagramRef={insertDiagramRef}
    wsRef={wsRef}
    userId={userId}
    onCanvasReady={(methods) => { canvasRef.current = methods; }}
  />

  {/* Remote cursor overlays */}
  {Object.entries(remoteCursors).map(([uid, cursor]) => (
    <div
      key={uid}
      style={{
        position: 'absolute',
        left: cursor.x,
        top: cursor.y,
        pointerEvents: 'none',      // never blocks canvas interaction
        transform: 'translate(0, 0)',
        zIndex: 9999,
      }}
    >
      {/* Cursor arrow */}
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path
          d="M0 0 L0 12 L3.5 9 L6.5 15 L8 14.5 L5 8.5 L9 8.5 Z"
          fill={stringToColor(uid)}
          stroke="white"
          strokeWidth="0.5"
        />
      </svg>
      {/* Name label */}
      <div style={{
          background: stringToColor(uid),
          color: 'white',
          fontSize: '11px',
          padding: '2px 6px',
          borderRadius: '4px',
          marginTop: '2px',
          whiteSpace: 'nowrap',
          fontWeight: '600',
        }}>
          {cursor.label}
        </div>
    </div>
  ))}
</div>
  {isKanbanOpen && (
  <KanbanBoard
    columns={kanbanColumns}
    onClose={() => setIsKanbanOpen(false)}
    onAddCard={addCard}
    onDeleteCard={deleteCard}
    onMoveCard={moveCard}
    onAddColumn={addColumn}
    onDeleteColumn={deleteColumn}
    onSendToCanvas={() => {
      if (sendToCanvasRef.current) {
        sendToCanvasRef.current(kanbanColumns);
      }
      setIsKanbanOpen(false); // close panel after sending
    }}
  />
)}

{showAI && (
  <AIDiagram
    onClose={() => setShowAI(false)}
    onInsertDiagram={(pngUrl) => {
      if (insertDiagramRef.current) insertDiagramRef.current(pngUrl);
      setShowAI(false);
    }}
  />
)}
    </div>
  );
}

export default App;