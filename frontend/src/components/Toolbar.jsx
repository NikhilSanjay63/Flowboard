const TOOLS = ["select", "pen", "rectangle", "circle", "text"];

const ICONS = {
  select: "🖱️",
  pen: "✏️",
  rectangle: "▭",
  circle: "○",
  text: "T",
};

function Toolbar({ activeTool, onToolChange, color, onColorChange, strokeWidth, onStrokeWidthChange, onClear, onUndo, onRedo, onImportImage, onExportPNG, onExportPDF, onExportPPTX }) {
  return (
    <div style={{
      position: "fixed",
      top: "50%",
      left: "16px",
      transform: "translateY(-50%)",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      backgroundColor: "#1e1e2e",
      padding: "12px 8px",
      borderRadius: "16px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
      zIndex: 100,
      alignItems: "center",
    }}>

      {/* Tool Buttons */}
      {TOOLS.map((tool) => (
        <button
          key={tool}
          title={tool.charAt(0).toUpperCase() + tool.slice(1)}
          onClick={() => onToolChange(tool)}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            backgroundColor: activeTool === tool ? "#7c3aed" : "#2e2e3e",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.15s",
          }}
        >
          {ICONS[tool]}
        </button>
      ))}

      {/* Divider */}
      <div style={{ width: "32px", height: "1px", backgroundColor: "#3e3e4e", margin: "4px 0" }} />

      {/* Color Picker */}
      <input
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        title="Color"
        style={{
          width: "36px",
          height: "36px",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          padding: "2px",
          backgroundColor: "#2e2e3e",
        }}
      />

      {/* Stroke Width */}
      <input
        type="range"
        min="1"
        max="20"
        value={strokeWidth}
        onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
        title={`Stroke: ${strokeWidth}px`}
        style={{
          writingMode: "vertical-lr",
          direction: "rtl",
          height: "80px",
          cursor: "pointer",
          accentColor: "#7c3aed",
        }}
      />

      {/* Divider */}
      <div style={{ width: "32px", height: "1px", backgroundColor: "#3e3e4e", margin: "4px 0" }} />

      {/* Undo */}
      <button
        title="Undo"
        onClick={onUndo}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          fontSize: "18px",
          backgroundColor: "#2e2e3e",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ↩️
      </button>

      {/* Redo */}
      <button
        title="Redo"
        onClick={onRedo}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          fontSize: "18px",
          backgroundColor: "#2e2e3e",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ↪️
      </button>

      {/* Divider */}
      <div style={{ width: "32px", height: "1px", backgroundColor: "#3e3e4e", margin: "4px 0" }} />

      {/* Clear */}
      <button
        title="Clear Canvas"
        onClick={onClear}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          fontSize: "18px",
          backgroundColor: "#2e2e3e",
          color: "#ff6b6b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        🗑️
      </button>

      {/* Import Image */}
      <button
        title="Import Image"
        onClick={onImportImage}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          fontSize: "18px",
          backgroundColor: "#2e2e3e",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
      🖼️
      </button>
      <button
        title="Export PNG"
        onClick={onExportPNG}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          fontSize: "18px",
          backgroundColor: "#2e2e3e",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          }}
        >
       📷
        </button>
      <button
          title="Export PDF"
          onClick={onExportPDF}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            backgroundColor: "#2e2e3e",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            }}
        >
          📄
       </button>

       <button
            title="Export PPTX"
            onClick={onExportPPTX}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              backgroundColor: "#2e2e3e",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              }}
>
        📊
        </button>

    </div>
  );
}

export default Toolbar;