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
      />
    </div>
  );
}

export default App;