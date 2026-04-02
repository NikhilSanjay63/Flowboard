import { useState, useEffect, useRef } from "react";
import Canvas from "./components/Canvas";
import Toolbar from "./components/Toolbar";
import KanbanBoard from "./components/KanbanBoard";

function App() {
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

const sendToCanvasRef = useRef(null);

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

      <button
      onClick={() => setIsKanbanOpen((prev) => !prev)}
     style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 200,
        padding: "10px 18px",
        backgroundColor: "#89b4fa",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "14px",
       }}
      >
        📋 Kanban
      </button>

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
      />
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
      />
  {isKanbanOpen && (
  <KanbanBoard
    columns={kanbanColumns}
    onClose={() => setIsKanbanOpen(false)}
    onAddCard={addCard}
    onDeleteCard={deleteCard}
    onMoveCard={moveCard}
    onSendToCanvas={() => {
      if (sendToCanvasRef.current) {
        sendToCanvasRef.current(kanbanColumns);
      }
      setIsKanbanOpen(false); // close panel after sending
    }}
  />
)}
    </div>
  );
}

export default App;