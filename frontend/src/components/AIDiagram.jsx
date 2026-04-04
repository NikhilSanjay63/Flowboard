import { useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "default" });

function AIDiagram({ onInsertDiagram, onClose }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [mermaidCode, setMermaidCode] = useState("");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setMermaidCode("");

    try {
      const response = await fetch("http://localhost:8000/ai/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      setMermaidCode(data.mermaid_code);
    } catch (err) {
      setError("Failed to generate diagram. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = async () => {
    if (!mermaidCode.trim()) return;

    try {
      const diagramId = "mermaid-render-" + Date.now();
      // Clean up common AI mistakes in Mermaid syntax
      const cleanCode = mermaidCode
        .replace(/\|>(\s)/g, "| ")        // fix |> arrows
        .replace(/-->/g, "-->")           // normalize arrows
        .trim();
      
      const { svg } = await mermaid.render(diagramId, cleanCode);

      // Pass SVG as a data URL directly — no canvas conversion needed
      const svgDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      onInsertDiagram(svgDataUrl);
    } catch (err) {
      setError("Failed to render diagram. Check the Mermaid syntax.");
      console.error(err);
    }
  };

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "#1e1e2e",
      border: "1px solid #3e3e4e",
      borderRadius: "14px",
      padding: "20px",
      width: "480px",
      zIndex: 200,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#cdd6f4", fontWeight: "bold", fontSize: "15px" }}>
          🤖 AI Diagram Generator
        </span>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "#6c7086",
          cursor: "pointer", fontSize: "18px"
        }}>✕</button>
      </div>

      {/* Prompt input */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your diagram... e.g. 'user login flow' or 'microservices architecture'"
        rows={3}
        style={{
          backgroundColor: "#2e2e3e",
          border: "1px solid #3e3e4e",
          borderRadius: "8px",
          color: "#cdd6f4",
          padding: "10px",
          fontSize: "13px",
          resize: "none",
          outline: "none",
          fontFamily: "inherit",
        }}
      />

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        style={{
          backgroundColor: loading ? "#3e3e4e" : "#7c3aed",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          padding: "10px",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "bold",
          fontSize: "14px",
        }}
      >
        {loading ? "Generating..." : "✨ Generate Diagram"}
      </button>

      {/* Error */}
      {error && (
        <div style={{ color: "#f38ba8", fontSize: "13px" }}>{error}</div>
      )}

      {/* Mermaid code preview */}
      {mermaidCode && (
        <>
          <textarea
            value={mermaidCode}
            onChange={(e) => setMermaidCode(e.target.value)}
            rows={6}
            style={{
              backgroundColor: "#2e2e3e",
              border: "1px solid #45475a",
              borderRadius: "8px",
              color: "#a6e3a1",
              padding: "10px",
              fontSize: "12px",
              fontFamily: "monospace",
              resize: "none",
              outline: "none",
            }}
          />
          <button
            onClick={handleInsert}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "10px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            📌 Insert onto Canvas
          </button>
        </>
      )}
    </div>
  );
}

export default AIDiagram;