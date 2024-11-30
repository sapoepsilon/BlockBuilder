// lib/utils/canvas/blocks.ts
import type { Block, Point } from '$lib/types/canvas';

export function createBlock(position: Point): Block {
  return {
    id: crypto.randomUUID(),
    x: position.x,
    y: position.y,
    width: 100,
    height: 100,
  };
}

export function updateBlockPosition(block: Block, position: Point): Block {
  return {
    ...block,
    x: position.x,
    y: position.y
  };
}

export function isPointInBlock(point: Point, block: Block): boolean {
  return (
    point.x >= block.x &&
    point.x <= block.x + block.width &&
    point.y >= block.y &&
    point.y <= block.y + block.height
  );
}