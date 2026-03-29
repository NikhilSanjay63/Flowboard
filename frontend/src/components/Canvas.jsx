import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, PencilBrush, Rect, Circle, IText, FabricImage } from "fabric";
import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";

function Canvas({ activeTool, color, strokeWidth, clearFlag, undoFlag, redoFlag, deleteSelectedRef, imageFile, exportCanvasRef, exportPDFRef, exportPPTXRef }) {
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

    canvas.on("object:added", saveSnapshot);
    canvas.on("object:modified", saveSnapshot);
    canvas.on("object:removed", saveSnapshot);

    saveSnapshot();

    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      canvas.renderAll();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.dispose();
    };
  }, []);

  // Register delete handler so App.jsx can call it via ref
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

  // React to tool / color / strokeWidth changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.off("mouse:down");
    canvas.off("mouse:move");
    canvas.off("mouse:up");

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
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: "transparent",
            stroke: color,
            strokeWidth: strokeWidth,
            selectable: false,
          });
        } else {
          shape = new Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 0,
            fill: "transparent",
            stroke: color,
            strokeWidth: strokeWidth,
            selectable: false,
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
          const radius =
            Math.sqrt(
              Math.pow(pointer.x - originX.current, 2) +
              Math.pow(pointer.y - originY.current, 2)
            ) / 2;
          activeShape.current.set({
            left: (pointer.x + originX.current) / 2,
            top: (pointer.y + originY.current) / 2,
            radius: radius,
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
          left: pointer.x,
          top: pointer.y,
          fontSize: strokeWidth * 6 + 10,
          fill: color,
          editable: true,
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

  // Import image onto canvas
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
      if (fabricImage.width > maxWidth) {
        fabricImage.scaleToWidth(maxWidth);
      }
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const imgElement = new Image();
      imgElement.src = ev.target.result;
      imgElement.onload = () => {
        const fabricImage = new FabricImage(imgElement);
        const maxWidth = fabricRef.current.getWidth() * 0.6;
        if (fabricImage.width > maxWidth) {
          fabricImage.scaleToWidth(maxWidth);
        }
        const rect = canvasEl.getBoundingClientRect();
        fabricImage.set({
          left: e.clientX - rect.left,
          top: e.clientY - rect.top,
        });
        fabricRef.current.add(fabricImage);
        fabricRef.current.setActiveObject(fabricImage);
        fabricRef.current.renderAll();
        saveSnapshot();
      };
    };
    reader.readAsDataURL(file);
  };

  // Block on document level so browser never navigates away
  document.addEventListener("dragover", handleDragOver);
  document.addEventListener("drop", handleDrop);

  return () => {
    document.removeEventListener("dragover", handleDragOver);
    document.removeEventListener("drop", handleDrop);
  };
}, []);

// Register PNG export handler
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

// Register PDF export handler
useEffect(() => {
  if (!exportPDFRef) return;
  exportPDFRef.current = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL({ format: "png", multiplier: 1 });
    const widthPx = canvas.getWidth();
    const heightPx = canvas.getHeight();
    // Convert pixels to mm (jsPDF uses mm by default, 1px = 0.264583mm)
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

// Register PPTX export handler
useEffect(() => {
  if (!exportPPTXRef) return;
  exportPPTXRef.current = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL({ format: "png", multiplier: 1 });
    const widthPx = canvas.getWidth();
    const heightPx = canvas.getHeight();
    // Convert pixels to inches (pptxgenjs uses inches, 96px = 1 inch)
    const widthIn = widthPx / 96;
    const heightIn = heightPx / 96;
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: "CANVAS", width: widthIn, height: heightIn });
    pptx.layout = "CANVAS";
    const slide = pptx.addSlide();
    slide.addImage({
      data: dataURL,
      x: 0,
      y: 0,
      w: widthIn,
      h: heightIn,
    });
    pptx.writeFile({ fileName: "flowboard-export.pptx" });
  };
}, [exportPPTXRef]);

  return (
  <div style={{ overflow: "hidden", width: "100vw", height: "100vh" }}>
    <canvas ref={canvasElRef} />
  </div>
);
}

export default Canvas;