<script lang="ts">
  import { onMount } from 'svelte';
  import { canvasStore } from '$lib/stores/canvas';
  import { setupCanvas, resizeCanvas } from '$lib/utils/canvas/setup';
  import { drawGrid } from '$lib/utils/canvas/draw';
  import { handleMouseMove, handleWheel } from '$lib/utils/canvas/events';
  import { createBlock, updateBlockPosition, isPointInBlock } from '$lib/utils/canvas/blocks';
  import type { CanvasProps, Point } from '$lib/types/canvas';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  let state = $state({
    dragStartPosition: { x: 0, y: 0 } as Point
  });
  let { width, height } = $props<CanvasProps>();

  function getCanvasPoint(clientX: number, clientY: number): Point {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - $canvasStore.offsetX) / $canvasStore.scale,
      y: (clientY - rect.top - $canvasStore.offsetY) / $canvasStore.scale
    };
  }

  function handleBlockDragStart(event: MouseEvent) {
    const point = getCanvasPoint(event.clientX, event.clientY);
    const clickedBlock = $canvasStore.blocks.find(block => isPointInBlock(point, block));
    
    if (clickedBlock) {
      canvasStore.update(s => ({
        ...s,
        selectedBlockId: clickedBlock.id,
        draggingBlock: true,
        isDragging: false
      }));
      
      state.dragStartPosition = point;
    }
  }

  function handleBlockDragMove(event: MouseEvent) {
    if (!$canvasStore.draggingBlock || !$canvasStore.selectedBlockId) return;

    const currentPoint = getCanvasPoint(event.clientX, event.clientY);
    const deltaX = currentPoint.x - state.dragStartPosition.x;
    const deltaY = currentPoint.y - state.dragStartPosition.y;

    canvasStore.update(s => ({
      ...s,
      blocks: s.blocks.map(block => 
        block.id === s.selectedBlockId
          ? updateBlockPosition(block, {
              x: block.x + deltaX,
              y: block.y + deltaY
            })
          : block
      )
    }));

    state.dragStartPosition = currentPoint;
  }

  function handleBlockDragEnd() {
    canvasStore.update(s => ({
      ...s,
      selectedBlockId: null,
      draggingBlock: false
    }));
  }

  function handleCanvasClick(event: MouseEvent) {
    if (event.altKey) {
      const point = getCanvasPoint(event.clientX, event.clientY);
      const newBlock = createBlock(point);
      
      canvasStore.update(s => ({
        ...s,
        blocks: [...s.blocks, newBlock]
      }));
    }
  }

  function drawBlock(x: number, y: number, width: number, height: number) {
    if (!ctx) return;
    ctx.fillStyle = '#4299e1';
    ctx.fillRect(x, y, width, height);
  }

  function render() {
    if (!ctx) return;
    
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    ctx.save();
    ctx.translate($canvasStore.offsetX, $canvasStore.offsetY);
    ctx.scale($canvasStore.scale, $canvasStore.scale);
    
    drawGrid(ctx, canvas, $canvasStore.scale, $canvasStore.offsetX, $canvasStore.offsetY);
    
    // Draw all blocks
    $canvasStore.blocks?.forEach(block => {
      drawBlock(block.x, block.y, block.width, block.height);
    });
    
    ctx.restore();
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    if (!event.dataTransfer) return;

    const type = event.dataTransfer.getData('text/plain');
    if (type !== 'rectangle') return;

    const point = getCanvasPoint(event.clientX, event.clientY);

    const newBlock = {
      id: crypto.randomUUID(),
      x: point.x,
      y: point.y,
      width: 100,
      height: 100
    };

    canvasStore.update(state => ({
      ...state,
      blocks: [...(state.blocks || []), newBlock]
    }));
  }

  onMount(() => {
    ctx = setupCanvas(canvas);
    resizeCanvas(canvas);
    render();

    window.addEventListener('resize', () => {
      resizeCanvas(canvas);
      render();
    });
  });

  $effect(() => {
    render();
  });
</script>

<canvas
  bind:this={canvas}
  onmousedown={handleBlockDragStart}
  onmousemove={handleBlockDragMove}
  onmouseup={handleBlockDragEnd}
  onmouseleave={handleBlockDragEnd}
  onclick={handleCanvasClick}
  onwheel={(e) => {
    e.preventDefault();
    canvasStore.update(s => ({ ...s, ...handleWheel(e, $canvasStore) }));
  }}
  ondragover={handleDragOver}
  ondrop={handleDrop}
  class="cursor-grab active:cursor-grabbing"
/>

<div class="fixed bottom-4 right-4 p-4 bg-white/90 rounded-lg shadow-lg">
  <p class="text-sm text-gray-600">Press Alt + Click to create a new block</p>
</div>

<style>
  canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    touch-action: none;
  }
</style>
