export type Tool = 'select' | 'pencil' | 'line' | 'rectangle' | 'circle' | 'text' | 'eraser' | 'background';

export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
  };
}

export interface Room {
  id: string;
  name: string;
  users: User[];
  background?: {
    type: 'color' | 'image';
    value: string;
  };
}

export interface Point {
  x: number;
  y: number;
}

export interface ShapeProps {
  id: string;
  userId: string;
  tool: string;
  points?: Point[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  fill?: string;
  stroke: string;
  strokeWidth: number;
  fontSize?: number;
}

export interface WhiteboardState {
  shapes: ShapeProps[];
  history: ShapeProps[][];
  historyIndex: number;
  background?: {
    type: 'color' | 'image';
    value: string;
  };
}