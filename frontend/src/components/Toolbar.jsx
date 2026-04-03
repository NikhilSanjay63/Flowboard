import { useState } from "react";

const TOOLS = ["select", "pen", "rectangle", "circle", "text"];

const ICONS = {
  select: "🖱️",
  pen: "✏️",
  rectangle: "▭",
  circle: "○",
  text: "T",
};

const btnStyle = {
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
  flexShrink: 0,
};

const divider = (
  <div style={{ width: "1px", height: "32px", backgroundColor: "#3e3e4e", margin: "0 4px" }} />
);

function Toolbar({
  activeTool, onToolChange,
  color, onColorChange,
  strokeWidth, onStrokeWidthChange,
  onClear, onUndo, onRedo,
  onImportImage,
  onExportPNG, onExportPDF, onExportPPTX,
  showKanban, onToggleKanban,
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      position: "fixed",
      top: "12px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      gap: "4px",
    }}>
      {/* Collapse/Expand toggle — always visible */}
      <button
        title={collapsed ? "Expand Toolbar" : "Collapse Toolbar"}
        onClick={() => setCollapsed(prev => !prev)}
        style={{
          ...btnStyle,
          backgroundColor: "#1e1e2e",
          fontSize: "14px",
          border: "1px solid #3e3e4e",
        }}
      >
        {collapsed ? "▶" : "◀"}
      </button>

      {/* Main toolbar — hidden when collapsed */}
      {!collapsed && (
        <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "#1e1e2e",
          padding: "8px 12px",
          borderRadius: "14px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}>

          {/* Tool Buttons */}
          {TOOLS.map((tool) => (
            <button
              key={tool}
              title={tool.charAt(0).toUpperCase() + tool.slice(1)}
              onClick={() => onToolChange(tool)}
              style={{
                ...btnStyle,
                backgroundColor: activeTool === tool ? "#7c3aed" : "#2e2e3e",
              }}
            >
              {ICONS[tool]}
            </button>
          ))}

          {divider}

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
              flexShrink: 0,
            }}
          />

          {/* Stroke Width — now horizontal */}
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
            title={`Stroke: ${strokeWidth}px`}
            style={{
              width: "80px",
              cursor: "pointer",
              accentColor: "#7c3aed",
              flexShrink: 0,
            }}
          />

          {divider}

          {/* Undo */}
          <button title="Undo" onClick={onUndo} style={btnStyle}>↩️</button>

          {/* Redo */}
          <button title="Redo" onClick={onRedo} style={btnStyle}>↪️</button>

          {divider}

          {/* Clear */}
          <button title="Clear Canvas" onClick={onClear}
            style={{ ...btnStyle, color: "#ff6b6b" }}>
            🗑️
          </button>

          {/* Import Image */}
          <button title="Import Image" onClick={onImportImage} style={btnStyle}>🖼️</button>

          {/* Export PNG */}
          <button title="Export PNG" onClick={onExportPNG} style={btnStyle}>📷</button>

          {/* Export PDF */}
          <button title="Export PDF" onClick={onExportPDF} style={btnStyle}>📄</button>

          {/* Export PPTX */}
          <button title="Export PPTX" onClick={onExportPPTX} style={btnStyle}>📊</button>

          {divider}

          {/* Kanban Toggle */}
          <button
            title="Toggle Kanban Board"
            onClick={onToggleKanban}
            style={{
              ...btnStyle,
              width: "auto",
              padding: "0 12px",
              backgroundColor: showKanban ? "#6366f1" : "#2e2e3e",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            📋 {showKanban ? "Hide" : "Kanban"}
          </button>

        </div>
      )}
    </div>
  );
}

export default Toolbar;