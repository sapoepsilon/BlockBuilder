import type { Block } from "$lib/types/canvas";

export function drawGrid(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement,
    scale: number,
    offsetX: number,
    offsetY: number
  ) {
    const gridSize = 50;
    const width = canvas.width / scale;
    const height = canvas.height / scale;
    
    const startX = Math.floor(-offsetX / scale / gridSize) * gridSize;
    const startY = Math.floor(-offsetY / scale / gridSize) * gridSize;
    const endX = startX + width + gridSize;
    const endY = startY + height + gridSize;
    
    ctx.beginPath();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1 / scale;
    
    // Draw vertical lines
    for (let x = startX; x < endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    
    // Draw horizontal lines
    for (let y = startY; y < endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    
    ctx.stroke();
  }

  export function drawBlock(
    ctx: CanvasRenderingContext2D,
    block: Block
  ) {
    ctx.fillStyle = '#4299e1'; // blue-500
    ctx.fillRect(block.x, block.y, block.width, block.height);
  }
  