export interface Point {
    x: number;
    y: number;
  }
  
// lib/types/canvas.ts
export interface Block {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasState {
  isDragging: boolean;
  lastX: number;
  lastY: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  mouseX: number;
  mouseY: number;
  blocks: Block[];
  draggingBlock: boolean;
  selectedBlockId: string | null;
}

  export interface CanvasProps {
    width?: number;
    height?: number;
  }
  
  export interface ControlPanelProps {
    mouseX: number;
    mouseY: number;
    scale: number;
    offsetX: number;
    offsetY: number;
  }