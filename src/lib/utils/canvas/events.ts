import type { CanvasState } from '$lib/types/canvas';

export function handleMouseMove(
  event: MouseEvent,
  state: CanvasState
): Partial<CanvasState> {
  if (!state.isDragging) {
    return {
      mouseX: (event.clientX - state.offsetX) / state.scale,
      mouseY: (event.clientY - state.offsetY) / state.scale
    };
  }

  const deltaX = event.clientX - state.lastX;
  const deltaY = event.clientY - state.lastY;

  return {
    offsetX: state.offsetX + deltaX,
    offsetY: state.offsetY + deltaY,
    lastX: event.clientX,
    lastY: event.clientY,
    mouseX: (event.clientX - state.offsetX) / state.scale,
    mouseY: (event.clientY - state.offsetY) / state.scale
  };
}

export function handleWheel(
  event: WheelEvent,
  state: CanvasState
): Partial<CanvasState> {
  const zoomFactor = 0.95;
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  
  const pointXBeforeZoom = (mouseX - state.offsetX) / state.scale;
  const pointYBeforeZoom = (mouseY - state.offsetY) / state.scale;
  
  const newScale = event.deltaY > 0 
    ? state.scale * zoomFactor 
    : state.scale / zoomFactor;
  
  const scale = Math.min(Math.max(0.1, newScale), 5);
  
  const pointXAfterZoom = (mouseX - state.offsetX) / scale;
  const pointYAfterZoom = (mouseY - state.offsetY) / scale;
  
  return {
    scale,
    offsetX: state.offsetX + (pointXAfterZoom - pointXBeforeZoom) * scale,
    offsetY: state.offsetY + (pointYAfterZoom - pointYBeforeZoom) * scale
  };
}