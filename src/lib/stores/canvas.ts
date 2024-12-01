// lib/stores/canvas.ts
import { writable } from 'svelte/store';
import type { Block } from '$lib/types/canvas';

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
  selectedBlockId: string | null;
  draggingBlock: boolean;
}

export const canvasStore = writable<CanvasState>({
  isDragging: false,
  lastX: 0,
  lastY: 0,
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  mouseX: 0,
  mouseY: 0,
  blocks: [],
  selectedBlockId: null,
  draggingBlock: false
});