// frontend/src/components/LandingPage.jsx

import { useState } from "react";

export default function LandingPage({ onJoin }) {
  const [boardName, setBoardName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  function handleJoin() {
    const trimmedBoard = boardName.trim();
    const trimmedUser = displayName.trim();

    if (!trimmedBoard) {
      setError("Please enter a board name.");
      return;
    }
    if (!trimmedUser) {
      setError("Please enter your display name.");
      return;
    }

    // Convert board name to a URL-safe ID: lowercase, spaces → hyphens
    const boardId = trimmedBoard.toLowerCase().replace(/\s+/g, "-");

    setError("");
    onJoin({ boardId, boardName: trimmedBoard, displayName: trimmedUser });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleJoin();
  }

  return (
    <div style={styles.overlay}>
                    <style>{`
            @keyframes float {
                0%, 100% { transform: translateY(0px); opacity: 0.15; }
                50% { transform: translateY(-30px); opacity: 0.3; }
            }
            .dot { position: absolute; border-radius: 50%; background: #6366f1; animation: float ease-in-out infinite; pointer-events: none; }
            `}</style>
            <div className="dot" style={{ width:200, height:200, top:"10%", left:"5%", animationDuration:"7s" }} />
            <div className="dot" style={{ width:120, height:120, top:"60%", left:"80%", animationDuration:"5s", animationDelay:"1s" }} />
            <div className="dot" style={{ width:80,  height:80,  top:"80%", left:"20%", animationDuration:"9s", animationDelay:"2s" }} />
            <div className="dot" style={{ width:160, height:160, top:"20%", left:"70%", animationDuration:"6s", animationDelay:"0.5s" }} />
      <div style={styles.card}>
        {/* Logo / Title */}
        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>🖊️</span>
          <h1 style={styles.title}>FlowBoard</h1>
        </div>
        <p style={styles.subtitle}>
          Your collaborative visual workspace
        </p>

        <div style={styles.divider} />

        {/* Inputs */}
        <label style={styles.label}>Board Name</label>
        <input
          style={styles.input}
          type="text"
          placeholder="e.g. Sprint Planning, My Ideas…"
          value={boardName}
          onChange={(e) => setBoardName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        <label style={styles.label}>Your Display Name</label>
        <input
          style={styles.input}
          type="text"
          placeholder="e.g. Nikki, Alex…"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={handleJoin}>
          Create / Join Board →
        </button>

        <p style={styles.hint}>
          Same board name = same board. Share the name with teammates to collaborate live.
        </p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  position: "relative",
  overflow: "hidden",
},
  card: {
    background: "#1e1e2e",
    border: "1px solid #2a2a3e",
    borderRadius: "16px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: "0px",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
  },
  logoIcon: {
    fontSize: "36px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "700",
    color: "#e2e8f0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: "0 0 24px 0",
    color: "#94a3b8",
    fontSize: "15px",
  },
  divider: {
    height: "1px",
    background: "#2a2a3e",
    marginBottom: "24px",
  },
  label: {
    display: "block",
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #2a2a3e",
    background: "#12121e",
    color: "#e2e8f0",
    fontSize: "15px",
    marginBottom: "20px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  error: {
    color: "#f87171",
    fontSize: "13px",
    marginBottom: "12px",
    margin: "-8px 0 12px 0",
  },
  button: {
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "4px",
    marginBottom: "16px",
    transition: "opacity 0.2s",
  },
  hint: {
    color: "#64748b",
    fontSize: "13px",
    textAlign: "center",
    margin: 0,
    lineHeight: "1.5",
  },
};