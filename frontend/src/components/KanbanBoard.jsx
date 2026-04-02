import { useRef } from "react";

function KanbanBoard({ columns, onClose, onAddCard, onDeleteCard, onMoveCard, onSendToCanvas }) {

//The drawing logic follows a simple formula:
//column X position = START_X + columnIndex * (COLUMN_WIDTH + COLUMN_GAP)
//card Y position   = column Y + TITLE_HEIGHT + cardIndex * (CARD_HEIGHT + CARD_GAP)

  // Stores which card is being dragged and where it came from
  // useRef because this doesn't need to trigger a re-render
  const dragRef = useRef(null);

  function handleDragStart(cardId, fromColumnId) {
    dragRef.current = { cardId, fromColumnId };
  }

  function handleDragOver(e) {
    e.preventDefault(); // REQUIRED — tells the browser "yes, dropping is allowed here"
  }

  function handleDrop(toColumnId) {
    if (!dragRef.current) return;
    const { cardId, fromColumnId } = dragRef.current;
    onMoveCard(cardId, fromColumnId, toColumnId);
    dragRef.current = null; // clear after drop
  }

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0,
      width: "100vw", height: "100vh",
      backgroundColor: "rgba(0,0,0,0.4)",
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      }}>

      <div style={{
        backgroundColor: "#1e1e2e",
        borderRadius: "12px",
        padding: "24px",
        width: "90vw",
        maxWidth: "900px",
        height: "70vh",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}>

       {/* Header */}
       <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        }}>
        <h2 style={{ color: "#cdd6f4", margin: 0, fontSize: "20px" }}>
            📋 Kanban Board
        </h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        </div>
    {/* Send to Canvas button */}
    <button
      onClick={onSendToCanvas}
      style={{
        backgroundColor: "#a6e3a1",
        border: "none",
        borderRadius: "8px",
        padding: "8px 14px",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "13px",
        color: "#1e1e2e",
      }}
    >
      🖼 Send to Canvas
    </button>

    {/* Close button */}
    <button
      onClick={onClose}
      style={{
        background: "none",
        border: "none",
        color: "#cdd6f4",
        fontSize: "22px",
        cursor: "pointer",
      }}
    >
      ✕
    </button>
  </div>

        {/* Columns */}
        <div style={{
          display: "flex",
          gap: "16px",
          overflowX: "auto",
          flex: 1,
          alignItems: "flex-start",
          paddingBottom: "8px",
        }}>

          {columns.map((column) => (
            <div
              key={column.id}
              // Drop events go on the COLUMN
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
              style={{
                backgroundColor: "#313244",
                borderRadius: "8px",
                padding: "12px",
                minWidth: "220px",
                maxWidth: "220px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                // Highlight column when something is dragged over it
                transition: "background-color 0.2s",
              }}
              onDragEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#3d3f55";
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#313244";
              }}
            >
              {/* Column title */}
              <h3 style={{
                color: "#89b4fa",
                margin: 0,
                fontSize: "15px",
                fontWeight: 600,
              }}>
                {column.title}
              </h3>

              {/* Cards */}
              {column.cards.map((card) => (
                <div
                  key={card.id}
                  // Drag events go on the CARD
                  draggable
                  onDragStart={() => handleDragStart(card.id, column.id)}
                  style={{
                    backgroundColor: "#45475a",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    color: "#cdd6f4",
                    fontSize: "14px",
                    cursor: "grab",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <span style={{ flex: 1 }}>{card.text}</span>
                  <button
                    onClick={() => onDeleteCard(column.id, card.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#f38ba8",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: 0,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Add card button */}
              <button
                onClick={() => onAddCard(column.id)}
                style={{
                  backgroundColor: "transparent",
                  border: "1px dashed #585b70",
                  borderRadius: "6px",
                  color: "#6c7086",
                  padding: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  marginTop: "4px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "#89b4fa";
                  e.target.style.color = "#89b4fa";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "#585b70";
                  e.target.style.color = "#6c7086";
                }}
              >
                + Add Card
              </button>

            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
export default KanbanBoard;