import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, PencilBrush, Rect, Circle, IText } from "fabric";

function Canvas({ activeTool, color, strokeWidth, clearFlag, undoFlag, redoFlag, deleteSelectedRef }) {
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

  return (
    <div style={{ overflow: "hidden", width: "100vw", height: "100vh" }}>
      <canvas ref={canvasElRef} />
    </div>
  );
}

export default Canvas;