export interface Point {
    x: number;
    y: number;
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