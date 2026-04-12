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
  showKanban, onToggleKanban, onSaveBoard, onLoadBoard, showAI, onToggleAI, boardName, currentUser
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Main toolbar container - centered at top */}
      <div style={{
        position: "fixed",
        top: "12px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        maxWidth: "calc(100% - 24px)",
        padding: "0 12px",
      }}>
        {/* Collapse/Expand toggle */}
        <button
          title={collapsed ? "Expand Toolbar" : "Collapse Toolbar"}
          onClick={() => setCollapsed(prev => !prev)}
          style={{
            ...btnStyle,
            backgroundColor: "#1e1e2e",
            fontSize: "14px",
            border: "1px solid #3e3e4e",
            flexShrink: 0,
          }}
        >
          {collapsed ? "▶" : "◀"}
        </button>

        {/* Main toolbar - with overflow handling */}
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
            overflowX: "auto",
            overflowY: "hidden",
            maxWidth: "calc(100vw - 200px)",
            scrollbarWidth: "thin",
            WebkitOverflowScrolling: "touch",
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
                  flexShrink: 0,
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

            {/* Stroke Width */}
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
            <button title="Undo" onClick={onUndo} style={{ ...btnStyle, flexShrink: 0 }}>↩️</button>

            {/* Redo */}
            <button title="Redo" onClick={onRedo} style={{ ...btnStyle, flexShrink: 0 }}>↪️</button>

            {divider}

            {/* Clear */}
            <button title="Clear Canvas" onClick={onClear}
              style={{ ...btnStyle, color: "#ff6b6b", flexShrink: 0 }}>
              🗑️
            </button>

            {/* Import Image */}
            <button title="Import Image" onClick={onImportImage} style={{ ...btnStyle, flexShrink: 0 }}>🖼️</button>

            {/* Export PNG */}
            <button title="Export PNG" onClick={onExportPNG} style={{ ...btnStyle, flexShrink: 0 }}>📷</button>

            {/* Export PDF */}
            <button title="Export PDF" onClick={onExportPDF} style={{ ...btnStyle, flexShrink: 0 }}>📄</button>

            {/* Export PPTX */}
            <button title="Export PPTX" onClick={onExportPPTX} style={{ ...btnStyle, flexShrink: 0 }}>📊</button>

            {divider}

            {/* Save / Load */}
            <button title="Save Board" onClick={onSaveBoard}
              style={{ ...btnStyle, backgroundColor: "#2563eb", width: "auto", padding: "0 10px", fontSize: "13px", flexShrink: 0 }}>
              💾 Save
            </button>
            <button title="Load Board" onClick={onLoadBoard}
              style={{ ...btnStyle, backgroundColor: "#7c3aed", width: "auto", padding: "0 10px", fontSize: "13px", flexShrink: 0 }}>
              📂 Load
            </button>

            {divider}

            {/* AI Diagram */}
            <button
              title="AI Diagram Generator"
              onClick={onToggleAI}
              style={{
                ...btnStyle,
                width: "auto",
                padding: "0 12px",
                backgroundColor: showAI ? "#7c3aed" : "#2e2e3e",
                fontWeight: "bold",
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              🤖 AI
            </button>

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
                flexShrink: 0,
              }}
            >
              📋 {showKanban ? "Hide" : "Kanban"}
            </button>
          </div>
        )}
      </div>

      {/* Top Right Container for User and Board Name */}
      <div style={{
        position: "fixed",
        top: "12px",
        right: "20px",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        {currentUser && (
          <span style={{
            color: "#a3e635",
            fontWeight: "600",
            fontSize: "13px",
            padding: "5px 14px",
            background: "rgba(163,230,53,0.12)",
            border: "1px solid rgba(163,230,53,0.3)",
            borderRadius: "20px",
            whiteSpace: "nowrap",
          }}>
            👤 {currentUser}
          </span>
        )}

        {boardName && (
          <span style={{
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "13px",
            padding: "5px 14px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "20px",
            whiteSpace: "nowrap",
            letterSpacing: "0.3px",
            boxShadow: "0 2px 8px rgba(99,102,241,0.4)",
          }}>
            🖊️ {boardName}
          </span>
        )}
      </div>
    </>
  );
}

export default Toolbar;