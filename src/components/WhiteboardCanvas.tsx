import React, { useRef, useEffect, useState } from "react";
import { Stage, Layer, Line, Rect, Circle, Text } from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { KonvaEventObject } from "konva/lib/Node";
import styles from "../styles/WhiteboardCanvas.module.css";
import { Tool, ShapeProps, Point } from "../types";
import { useWhiteboard } from "../context/WhiteboardContext";
import { useSocket } from "../context/SocketContext";

interface WhiteboardCanvasProps {
  activeTool: Tool;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  fontSize: number;
}

const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  activeTool,
  strokeColor,
  strokeWidth,
  fillColor,
  fontSize,
}) => {
  const { state, addShape, updateShape } = useWhiteboard();
  const { currentUser, sendShape, sendCursorPosition } = useSocket();

  const stageRef = useRef<any>(null);
  const isDrawing = useRef(false);
  const [currentText, setCurrentText] = useState<string>("");
  const [textPosition, setTextPosition] = useState<Point | null>(null);
  const [textEditVisible, setTextEditVisible] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  const [points, setPoints] = useState<Point[]>([]);
  const [currentShape, setCurrentShape] = useState<{
    start: Point | null;
    end: Point | null;
  }>({
    start: null,
    end: null,
  });

  // Focus text area when it appears
  useEffect(() => {
    if (textEditVisible && textAreaRef.current) {
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();
          textAreaRef.current.select();
        }
      }, 10);
    }
  }, [textEditVisible]);

  // Set cursor based on active tool
  useEffect(() => {
    const container = document.querySelector(`.${styles.stageContainer}`);
    if (!container) return;

    switch (activeTool) {
      case "eraser":
        container.style.cursor =
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4L20 11L11 20'/%3E%3C/svg%3E\") 0 24, auto";
        break;
      case "text":
        container.style.cursor = "text";
        break;
      default:
        container.style.cursor = "crosshair";
    }
  }, [activeTool]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (stageRef.current) {
        stageRef.current.width(window.innerWidth);
        stageRef.current.height(window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Event handlers for both mouse and touch events
  const handlePointerDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!currentUser) return;

    // If text editor is open, close it when clicking elsewhere
    if (textEditVisible && activeTool === "text") {
      handleTextSubmit();
      return;
    }

    if (activeTool !== "select") {
      setSelectedShapeId(null);
    }

    // Get position from either mouse or touch event
    const stage = e.target.getStage()!;
    const pos = stage.getPointerPosition()!;

    if (activeTool === "select") {
      const clickedOnEmpty = e.target === stage;
      if (clickedOnEmpty) {
        setSelectedShapeId(null);
      }
      return;
    }

    if (activeTool === "text") {
      // Important: Set text state first, then make the editor visible
      const clickPos = { x: pos.x, y: pos.y };
      setTextPosition(clickPos);
      setCurrentText("");
      // Use setTimeout to ensure the state update for position happens first
      setTimeout(() => {
        setTextEditVisible(true);
      }, 0);
      return;
    }

    isDrawing.current = true;

    if (activeTool === "pencil" || activeTool === "eraser") {
      setPoints([{ x: pos.x, y: pos.y }]);
    } else {
      setCurrentShape({
        start: { x: pos.x, y: pos.y },
        end: { x: pos.x, y: pos.y },
      });
    }
  };

  const handlePointerMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!currentUser) return;

    const stage = e.target.getStage()!;
    const pos = stage.getPointerPosition()!;
    sendCursorPosition(pos.x, pos.y);

    if (!isDrawing.current) return;

    if (activeTool === "pencil" || activeTool === "eraser") {
      setPoints((oldPoints) => [...oldPoints, { x: pos.x, y: pos.y }]);
    } else if (currentShape.start) {
      setCurrentShape({
        ...currentShape,
        end: { x: pos.x, y: pos.y },
      });
    }
  };

  const handlePointerUp = () => {
    if (!currentUser || !isDrawing.current) return;

    isDrawing.current = false;

    if (activeTool === "pencil" || activeTool === "eraser") {
      if (points.length < 2) return;

      const newShape: ShapeProps = {
        id: uuidv4(),
        userId: currentUser.id,
        tool: activeTool,
        points,
        stroke: activeTool === "eraser" ? "#ffffff" : strokeColor,
        strokeWidth: activeTool === "eraser" ? strokeWidth * 2 : strokeWidth,
      };

      addShape(newShape);
      sendShape(newShape);
      setPoints([]);
    } else if (currentShape.start && currentShape.end) {
      const { start, end } = currentShape;

      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);

      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);

      if (width < 5 && height < 5) {
        setCurrentShape({ start: null, end: null });
        return;
      }

      const newShape: ShapeProps = {
        id: uuidv4(),
        userId: currentUser.id,
        tool: activeTool,
        x,
        y,
        width,
        height,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
      };

      if (activeTool === "line") {
        newShape.points = [start, end];
      }

      addShape(newShape);
      sendShape(newShape);
      setCurrentShape({ start: null, end: null });
    }
  };

  const handleTextSubmit = () => {
    if (!currentUser || !textPosition || !currentText.trim()) {
      setTextEditVisible(false);
      setCurrentText("");
      setTextPosition(null);
      return;
    }

    const newShape: ShapeProps = {
      id: uuidv4(),
      userId: currentUser.id,
      tool: "text",
      x: textPosition.x,
      y: textPosition.y,
      text: currentText,
      fontSize,
      fill: strokeColor,
      stroke: "transparent",
      strokeWidth: 0,
    };

    addShape(newShape);
    sendShape(newShape);

    setTextEditVisible(false);
    setCurrentText("");
    setTextPosition(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentText(e.target.value);
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setTextEditVisible(false);
      setCurrentText("");
      setTextPosition(null);
    }
  };

  const handleShapeClick = (id: string) => {
    if (activeTool === "select") {
      setSelectedShapeId(id);
    }
  };

  const handleShapeDragEnd = (id: string, x: number, y: number) => {
    updateShape(id, { x, y });
    const shape = state.shapes.find((s) => s.id === id);
    if (shape) {
      sendShape({ ...shape, x, y });
    }
  };

  // Render individual shapes - fixed to avoid key warnings
  const renderShape = (shape: ShapeProps, isSelected: boolean = false) => {
    const commonProps = {
      onClick: () => handleShapeClick(shape.id),
      onTap: () => handleShapeClick(shape.id),
      draggable: activeTool === "select",
      onDragEnd: (e: any) => {
        handleShapeDragEnd(shape.id, e.target.x(), e.target.y());
      },
      strokeScaleEnabled: false
    };

    switch (shape.tool) {
      case "pencil":
      case "eraser":
        return (
          <Line
            key={shape.id}
            points={shape.points?.flatMap((p) => [p.x, p.y]) || []}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation={
              shape.tool === "eraser" ? "destination-out" : "source-over"
            }
            {...commonProps}
          />
        );
      case "line":
        if (!shape.points || shape.points.length < 2) return null;
        return (
          <Line
            key={shape.id}
            points={[
              shape.points[0].x,
              shape.points[0].y,
              shape.points[1].x,
              shape.points[1].y,
            ]}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            lineCap="round"
            {...commonProps}
          />
        );
      case "rectangle":
        return (
          <Rect
            key={shape.id}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill={shape.fill}
            stroke={isSelected ? "#00A0FF" : shape.stroke}
            strokeWidth={isSelected ? shape.strokeWidth + 2 : shape.strokeWidth}
            dash={isSelected ? [10, 5] : undefined}
            {...commonProps}
          />
        );
      case "circle":
        return (
          <Circle
            key={shape.id}
            x={shape.x! + shape.width! / 2}
            y={shape.y! + shape.height! / 2}
            radius={Math.max(shape.width!, shape.height!) / 2}
            fill={shape.fill}
            stroke={isSelected ? "#00A0FF" : shape.stroke}
            strokeWidth={isSelected ? shape.strokeWidth + 2 : shape.strokeWidth}
            dash={isSelected ? [10, 5] : undefined}
            {...commonProps}
          />
        );
      case "text":
        return (
          <Text
            key={shape.id}
            x={shape.x}
            y={shape.y}
            text={shape.text}
            fontSize={shape.fontSize}
            fill={shape.fill}
            padding={5}
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  const renderCurrentShape = () => {
    if (!currentShape.start || !currentShape.end) return null;

    const { start, end } = currentShape;

    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);

    switch (activeTool) {
      case "line":
        return (
          <Line
            points={[start.x, start.y, end.x, end.y]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            lineCap="round"
          />
        );
      case "rectangle":
        return (
          <Rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      case "circle":
        return (
          <Circle
            x={x + width / 2}
            y={y + height / 2}
            radius={Math.max(width, height) / 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      default:
        return null;
    }
  };

  const renderCurrentLine = () => {
    if (points.length < 1) return null;

    return (
      <Line
        points={points.flatMap((p) => [p.x, p.y])}
        stroke={activeTool === "eraser" ? "#ffffff" : strokeColor}
        strokeWidth={activeTool === "eraser" ? strokeWidth * 2 : strokeWidth}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation={
          activeTool === "eraser" ? "destination-out" : "source-over"
        }
      />
    );
  };

  return (
    <div
      className={styles.stageContainer}
      style={{
        backgroundColor:
          state.background?.type === "color"
            ? state.background.value
            : "#ffffff",
        backgroundImage:
          state.background?.type === "image"
            ? `url(${state.background.value})`
            : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden"
      }}
    >
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handlePointerDown}
        onMousemove={handlePointerMove}
        onMouseup={handlePointerUp}
        onTouchstart={handlePointerDown}
        onTouchmove={handlePointerMove}
        onTouchend={handlePointerUp}
        className={styles.canvasContainer}
      >
        <Layer>
          {state.shapes.map((shape) =>
            renderShape(shape, shape.id === selectedShapeId)
          )}
          {renderCurrentShape()}
          {renderCurrentLine()}
        </Layer>
      </Stage>

      {textEditVisible && textPosition && (
        <div
          className={styles.textEditorOverlay}
          style={{
            position: "absolute",
            left: `${textPosition.x}px`,
            top: `${textPosition.y}px`,
            zIndex: 1000,
          }}
        >
          <textarea
            ref={textAreaRef}
            value={currentText}
            onChange={handleTextChange}
            onBlur={handleTextSubmit}
            onKeyDown={handleTextKeyDown}
            style={{
              width: "200px",
              minHeight: "50px",
              padding: "8px",
              backgroundColor: "white",
              border: `2px solid ${strokeColor}`,
              borderRadius: "4px",
              fontSize: `${fontSize}px`,
              color: strokeColor,
              resize: "both",
              outline: "none",
              fontFamily: "Arial, sans-serif"
            }}
            placeholder="Type your text here..."
          />
        </div>
      )}
    </div>
  );
};

export default WhiteboardCanvas;