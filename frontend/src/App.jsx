import { useState, useEffect } from "react"

function App() {
  const [status, setStatus] = useState(null)

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then(res => res.json())
      .then(data => {
        if (data.status === "ok") {
          setStatus("connected")
        }
      })
      .catch(() => setStatus("error"))
  }, [])

  return (
    <div style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: "100px" }}>
      <h1>FlowBoard</h1>
      {status === "connected" && (
        <p style={{ color: "green", fontSize: "1.2rem" }}>
          FlowBoard Backend Connected ✓
        </p>
      )}
      {status === "error" && (
        <p style={{ color: "red", fontSize: "1.2rem" }}>
          Backend connection failed ✗
        </p>
      )}
      {status === null && (
        <p style={{ color: "gray" }}>Connecting to backend...</p>
      )}
    </div>
  )
}

export default App