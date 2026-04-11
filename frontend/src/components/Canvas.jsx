import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, PencilBrush, Rect, Circle, IText, FabricImage, Text } from "fabric";
import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";

// Returns a version of fn that can only fire once every `limit` milliseconds
function throttle(fn, limit) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

function Canvas({ activeTool, color, strokeWidth, clearFlag, undoFlag, redoFlag, deleteSelectedRef, imageFile, exportCanvasRef, exportPDFRef, exportPPTXRef, sendToCanvasRef, getCanvasJSONRef, loadCanvasJSONRef, insertDiagramRef, onCanvasReady, wsRef, userId }) {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const isDrawingShape = useRef(false);
  const originX = useRef(0);
  const originY = useRef(0);
  const activeShape = useRef(null);
  const history = useRef([]);
  const historyIndex = useRef(-1);
  const isMutating = useRef(false);

  const saveSnapshot = () => {
    const canvas = fabricRef.current;
    if (!canvas || isMutating.current) return;
    const json = canvas.toJSON();
    history.current = history.current.slice(0, historyIndex.current + 1);
    history.current.push(json);
    if (history.current.length > 20) history.current.shift();
    historyIndex.current = history.current.length - 1;
  };

  // Initialize canvas once
  useEffect(() => {
    const canvas = new FabricCanvas(canvasElRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
    });

    fabricRef.current = canvas;

    // Throttled canvas update sender — max 10 times/second
    const sendCanvasUpdate = throttle((fabricCanvas) => {
      if (!wsRef?.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      if (isMutating.current) return;
      wsRef.current.send(JSON.stringify({
        type: 'canvas_update',
        canvasJSON: fabricCanvas.toJSON(),
      }));
    }, 100);

    canvas.on("object:added", () => { saveSnapshot(); sendCanvasUpdate(canvas); });
    canvas.on("object:modified", () => { saveSnapshot(); sendCanvasUpdate(canvas); });
    canvas.on("object:removed", () => { saveSnapshot(); sendCanvasUpdate(canvas); });

    // Throttled cursor sender — max 20 times/second
    const sendCursor = throttle((pointer) => {
      if (!wsRef?.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(JSON.stringify({
        type: 'cursor_move',
        x: pointer.x,
        y: pointer.y,
      }));
    }, 50);

    canvas.on("mouse:move", (opt) => {
      const pointer = canvas.getScenePoint(opt.e);
      sendCursor(pointer);
    });

    saveSnapshot();

    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      canvas.renderAll();
    };

    window.addEventListener("resize", handleResize);

    // Expose applyRemoteUpdate to App.jsx
    if (onCanvasReady) {
      onCanvasReady({
        applyRemoteUpdate: (canvasJSON) => {
          if (!fabricRef.current) return;
          isMutating.current = true;
          fabricRef.current.loadFromJSON(JSON.stringify(canvasJSON)).then(() => {
            fabricRef.current.renderAll();
            setTimeout(() => {
              isMutating.current = false;
            }, 50);
          });
        }
      });
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.dispose();
    };
  }, []);

  // Register delete handler
  useEffect(() => {
    if (!deleteSelectedRef) return;
    deleteSelectedRef.current = () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length === 0) return;
      activeObjects.forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
    };
  }, [deleteSelectedRef]);

  // Undo
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || undoFlag === 0) return;
    if (historyIndex.current <= 0) return;
    historyIndex.current -= 1;
    const snapshot = history.current[historyIndex.current];
    isMutating.current = true;
    canvas.loadFromJSON(snapshot).then(async () => {
      canvas.renderAll();
      await new Promise(resolve => setTimeout(resolve, 0));
      isMutating.current = false;
    });
  }, [undoFlag]);

  // Redo
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || redoFlag === 0) return;
    if (historyIndex.current >= history.current.length - 1) return;
    historyIndex.current += 1;
    const snapshot = history.current[historyIndex.current];
    isMutating.current = true;
    canvas.loadFromJSON(snapshot).then(async () => {
      canvas.renderAll();
      await new Promise(resolve => setTimeout(resolve, 0));
      isMutating.current = false;
    });
  }, [redoFlag]);

  // Tool / color / strokeWidth changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.off("mouse:down");
    canvas.off("mouse:up");
    // NOTE: deliberately NOT calling canvas.off("mouse:move")
    // because that would wipe the cursor tracker registered in the init useEffect

    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = "default";
    canvas.getObjects().forEach((obj) => (obj.selectable = true));

    if (activeTool === "pen") {
      canvas.isDrawingMode = true;
      const brush = new PencilBrush(canvas);
      brush.color = color;
      brush.width = strokeWidth;
      canvas.freeDrawingBrush = brush;

    } else if (activeTool === "rectangle" || activeTool === "circle") {
      canvas.selection = false;
      canvas.defaultCursor = "crosshair";
      canvas.getObjects().forEach((obj) => (obj.selectable = false));

      canvas.on("mouse:down", (opt) => {
        const pointer = canvas.getScenePoint(opt.e);
        isDrawingShape.current = true;
        originX.current = pointer.x;
        originY.current = pointer.y;

        let shape;
        if (activeTool === "rectangle") {
          shape = new Rect({
            left: pointer.x, top: pointer.y,
            width: 0, height: 0,
            fill: "transparent", stroke: color, strokeWidth, selectable: false,
          });
        } else {
          shape = new Circle({
            left: pointer.x, top: pointer.y,
            radius: 0,
            fill: "transparent", stroke: color, strokeWidth, selectable: false,
          });
        }

        activeShape.current = shape;
        canvas.add(shape);
      });

      canvas.on("mouse:move", (opt) => {
        if (!isDrawingShape.current || !activeShape.current) return;
        const pointer = canvas.getScenePoint(opt.e);
        if (activeTool === "rectangle") {
          activeShape.current.set({
            left: Math.min(pointer.x, originX.current),
            top: Math.min(pointer.y, originY.current),
            width: Math.abs(pointer.x - originX.current),
            height: Math.abs(pointer.y - originY.current),
          });
        } else {
          const radius = Math.sqrt(
            Math.pow(pointer.x - originX.current, 2) +
            Math.pow(pointer.y - originY.current, 2)
          ) / 2;
          activeShape.current.set({
            left: (pointer.x + originX.current) / 2,
            top: (pointer.y + originY.current) / 2,
            radius,
          });
        }
        canvas.renderAll();
      });

      canvas.on("mouse:up", () => {
        isDrawingShape.current = false;
        if (activeShape.current) {
          activeShape.current.set({ selectable: true });
          activeShape.current = null;
        }
        canvas.selection = false;
      });

    } else if (activeTool === "text") {
      canvas.defaultCursor = "text";
      canvas.on("mouse:down", (opt) => {
        const pointer = canvas.getScenePoint(opt.e);
        const text = new IText("Type here...", {
          left: pointer.x, top: pointer.y,
          fontSize: strokeWidth * 6 + 10,
          fill: color, editable: true,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
      });
    }

    canvas.renderAll();
  }, [activeTool, color, strokeWidth]);

  // Clear canvas
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || clearFlag === 0) return;
    isMutating.current = true;
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.renderAll();
    isMutating.current = false;
    saveSnapshot();
  }, [clearFlag]);

  // Import image
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !imageFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgElement = new Image();
      imgElement.src = e.target.result;
      imgElement.onload = () => {
        const fabricImage = new FabricImage(imgElement);
        const maxWidth = canvas.getWidth() * 0.6;
        if (fabricImage.width > maxWidth) fabricImage.scaleToWidth(maxWidth);
        canvas.add(fabricImage);
        canvas.setActiveObject(fabricImage);
        canvas.renderAll();
        saveSnapshot();
      };
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Drag-and-drop image import
  useEffect(() => {
    const canvasEl = canvasElRef.current;
    if (!canvasEl) return;
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => {
      e.preventDefault(); e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const imgElement = new Image();
        imgElement.src = ev.target.result;
        imgElement.onload = () => {
          const fabricImage = new FabricImage(imgElement);
          const maxWidth = fabricRef.current.getWidth() * 0.6;
          if (fabricImage.width > maxWidth) fabricImage.scaleToWidth(maxWidth);
          const rect = canvasEl.getBoundingClientRect();
          fabricImage.set({ left: e.clientX - rect.left, top: e.clientY - rect.top });
          fabricRef.current.add(fabricImage);
          fabricRef.current.setActiveObject(fabricImage);
          fabricRef.current.renderAll();
          saveSnapshot();
        };
      };
      reader.readAsDataURL(file);
    };
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);
    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  // PNG export
  useEffect(() => {
    if (!exportCanvasRef) return;
    exportCanvasRef.current = () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const dataURL = canvas.toDataURL({ format: "png", multiplier: 2 });
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "flowboard-export.png";
      link.click();
    };
  }, [exportCanvasRef]);

  // PDF export
  useEffect(() => {
    if (!exportPDFRef) return;
    exportPDFRef.current = () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const dataURL = canvas.toDataURL({ format: "png", multiplier: 1 });
      const widthPx = canvas.getWidth();
      const heightPx = canvas.getHeight();
      const widthMm = widthPx * 0.264583;
      const heightMm = heightPx * 0.264583;
      const pdf = new jsPDF({
        orientation: widthPx > heightPx ? "landscape" : "portrait",
        unit: "mm",
        format: [widthMm, heightMm],
      });
      pdf.addImage(dataURL, "PNG", 0, 0, widthMm, heightMm);
      pdf.save("flowboard-export.pdf");
    };
  }, [exportPDFRef]);

  // PPTX export
  useEffect(() => {
    if (!exportPPTXRef) return;
    exportPPTXRef.current = () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const dataURL = canvas.toDataURL({ format: "png", multiplier: 1 });
      const widthIn = canvas.getWidth() / 96;
      const heightIn = canvas.getHeight() / 96;
      const pptx = new PptxGenJS();
      pptx.defineLayout({ name: "CANVAS", width: widthIn, height: heightIn });
      pptx.layout = "CANVAS";
      const slide = pptx.addSlide();
      slide.addImage({ data: dataURL, x: 0, y: 0, w: widthIn, h: heightIn });
      pptx.writeFile({ fileName: "flowboard-export.pptx" });
    };
  }, [exportPPTXRef]);

  // Get canvas JSON
  useEffect(() => {
    if (!getCanvasJSONRef) return;
    getCanvasJSONRef.current = () => JSON.stringify(fabricRef.current.toJSON());
  }, [getCanvasJSONRef]);

  // Load canvas JSON
  useEffect(() => {
    if (!loadCanvasJSONRef) return;
    loadCanvasJSONRef.current = async (jsonString) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      isMutating.current = true;
      await canvas.loadFromJSON(jsonString);
      await new Promise(resolve => setTimeout(resolve, 50));
      canvas.requestRenderAll();
      canvas.renderAll();
      isMutating.current = false;
      saveSnapshot();
    };
  }, [loadCanvasJSONRef]);

  // Insert AI diagram
  useEffect(() => {
    if (!insertDiagramRef) return;
    insertDiagramRef.current = async (svgDataUrl) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const svgString = decodeURIComponent(
        svgDataUrl.replace("data:image/svg+xml;charset=utf-8,", "")
      );
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
      const svgEl = svgDoc.querySelector("svg");
      const viewBox = svgEl?.getAttribute("viewBox")?.split(" ").map(Number);
      const svgWidth = viewBox?.[2] || parseFloat(svgEl?.getAttribute("width")) || 800;
      const svgHeight = viewBox?.[3] || parseFloat(svgEl?.getAttribute("height")) || 600;
      svgEl.setAttribute("width", svgWidth);
      svgEl.setAttribute("height", svgHeight);
      const bgRect = svgDoc.createElementNS("http://www.w3.org/2000/svg", "rect");
      bgRect.setAttribute("width", "100%");
      bgRect.setAttribute("height", "100%");
      bgRect.setAttribute("fill", "white");
      svgEl.insertBefore(bgRect, svgEl.firstChild);
      const finalSvg = new XMLSerializer().serializeToString(svgDoc);
      const svgBase64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(finalSvg)));
      FabricImage.fromURL(svgBase64).then((fImg) => {
        const maxWidth = canvas.getWidth() * 0.6;
        if (fImg.width > maxWidth) fImg.scaleToWidth(maxWidth);
        fImg.set({
          left: canvas.getWidth() / 2 - (fImg.width * (fImg.scaleX || 1)) / 2,
          top: canvas.getHeight() / 2 - (fImg.height * (fImg.scaleY || 1)) / 2,
        });
        canvas.add(fImg);
        canvas.setActiveObject(fImg);
        canvas.renderAll();
        saveSnapshot();
      });
    };
  }, [insertDiagramRef]);

  // Send to canvas (Kanban)
  if (sendToCanvasRef) {
    sendToCanvasRef.current = (columns) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const COLUMN_WIDTH = 180, COLUMN_PADDING = 16, CARD_HEIGHT = 36;
      const CARD_GAP = 8, COLUMN_GAP = 24, START_X = 60, START_Y = 60, TITLE_HEIGHT = 40;
      columns.forEach((column, colIndex) => {
        const columnHeight = TITLE_HEIGHT + COLUMN_PADDING + column.cards.length * (CARD_HEIGHT + CARD_GAP) + COLUMN_PADDING;
        const x = START_X + colIndex * (COLUMN_WIDTH + COLUMN_GAP);
        const y = START_Y;
        canvas.add(new Rect({ left: x, top: y, width: COLUMN_WIDTH, height: Math.max(columnHeight, 120), fill: "#313244", rx: 8, ry: 8, stroke: "#45475a", strokeWidth: 1 }));
        canvas.add(new Text(column.title, { left: x + COLUMN_PADDING, top: y + 12, fontSize: 14, fontWeight: "bold", fill: "#89b4fa", selectable: false, fontFamily: "Arial" }));
        column.cards.forEach((card, cardIndex) => {
          const cardX = x + COLUMN_PADDING;
          const cardY = y + TITLE_HEIGHT + cardIndex * (CARD_HEIGHT + CARD_GAP);
          canvas.add(new Rect({ left: cardX, top: cardY, width: COLUMN_WIDTH - COLUMN_PADDING * 2, height: CARD_HEIGHT, fill: "#45475a", rx: 4, ry: 4, stroke: "#585b70", strokeWidth: 1 }));
          canvas.add(new Text(card.text, { left: cardX + 8, top: cardY + 10, fontSize: 11, fill: "#cdd6f4", selectable: false, fontFamily: "Arial", width: COLUMN_WIDTH - COLUMN_PADDING * 2 - 16 }));
        });
      });
      canvas.renderAll();
    };
  }

  return (
    <div style={{ overflow: "hidden", width: "100vw", height: "100vh" }}>
      <canvas ref={canvasElRef} />
    </div>
  );
}

export default Canvas;