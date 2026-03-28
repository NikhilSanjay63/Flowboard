import { useState, useEffect, useRef } from "react";
import Canvas from "./components/Canvas";
import Toolbar from "./components/Toolbar";

function App() {
  const [activeTool, setActiveTool] = useState("select");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [clearFlag, setClearFlag] = useState(0);
  const [undoFlag, setUndoFlag] = useState(0);
  const [redoFlag, setRedoFlag] = useState(0);
  const deleteSelectedRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't fire shortcuts when user is typing in a text field
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        setUndoFlag((f) => f + 1);
      }

      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        setRedoFlag((f) => f + 1);
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (deleteSelectedRef.current) {
          deleteSelectedRef.current();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div style={{ margin: 0, padding: 0, overflow: "hidden" }}>
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
      />
      <Canvas
        activeTool={activeTool}
        color={color}
        strokeWidth={strokeWidth}
        clearFlag={clearFlag}
        undoFlag={undoFlag}
        redoFlag={redoFlag}
        deleteSelectedRef={deleteSelectedRef}
      />
    </div>
  );
}

export default App;