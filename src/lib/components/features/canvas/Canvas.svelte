<script lang="ts">
  import { onMount } from 'svelte';
  import { canvasStore } from '$lib/stores/canvas';
  import { setupCanvas, resizeCanvas } from '$lib/utils/canvas/setup';
  import { drawGrid } from '$lib/utils/canvas/draw';
  import { handleWheel } from '$lib/utils/canvas/events';
  import { createBlock, updateBlockPosition, isPointInBlock } from '$lib/utils/canvas/blocks';
  import type { CanvasProps, Point, Block } from '$lib/types/canvas';
  import ApiBlock from './ApiBlock.svelte';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  let state = $state({
    dragStartPosition: { x: 0, y: 0 } as Point,
    isDragging: false,
    dragOffset: { x: 0, y: 0 } as Point,
    isPanning: false,
    panStart: { x: 0, y: 0 } as Point
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
    if (!(event.target as HTMLElement).closest('.api-block')) {
      const point = getCanvasPoint(event.clientX, event.clientY);
      const clickedBlock = $canvasStore.blocks.find(block => isPointInBlock(point, block));
      
      if (clickedBlock) {
        event.preventDefault();
        event.stopPropagation();
        
        state.dragOffset = {
          x: point.x - clickedBlock.x,
          y: point.y - clickedBlock.y
        };
        
        canvasStore.update(s => ({
          ...s,
          selectedBlockId: clickedBlock.id,
          draggingBlock: true
        }));
        
        state.dragStartPosition = point;
        state.isDragging = true;
        
        canvas.classList.add('dragging');
      } else {
        // Start panning if not clicking on a block
        state.isPanning = true;
        state.panStart = {
          x: event.clientX - $canvasStore.offsetX,
          y: event.clientY - $canvasStore.offsetY
        };
      }
    }
  }

  function handleBlockDragMove(event: MouseEvent) {
    if (state.isDragging && $canvasStore.selectedBlockId) {
      const currentPoint = getCanvasPoint(event.clientX, event.clientY);
      
      const newPosition = {
        x: currentPoint.x - state.dragOffset.x,
        y: currentPoint.y - state.dragOffset.y
      };

      requestAnimationFrame(() => {
        canvasStore.update(s => ({
          ...s,
          blocks: s.blocks.map(block => 
            block.id === s.selectedBlockId
              ? updateBlockPosition(block, newPosition)
              : block
          )
        }));
      });
    } else if (state.isPanning) {
      // Handle panning
      const newOffsetX = event.clientX - state.panStart.x;
      const newOffsetY = event.clientY - state.panStart.y;

      canvasStore.update(s => ({
        ...s,
        offsetX: newOffsetX,
        offsetY: newOffsetY
      }));
    }
  }

  function handleBlockDragEnd(event: MouseEvent) {
    if (state.isDragging) {
      state.isDragging = false;
      canvasStore.update(s => ({
        ...s,
        selectedBlockId: null,
        draggingBlock: false
      }));
      
      canvas.classList.remove('dragging');
    }
    
    state.isPanning = false;
  }

  function handleCanvasClick(event: MouseEvent) {
    if (!(event.target as HTMLElement).closest('.api-block')) {
      if (event.altKey) {
        const point = getCanvasPoint(event.clientX, event.clientY);
        const newBlock = createBlock(point);
        
        canvasStore.update(s => ({
          ...s,
          blocks: [...s.blocks, newBlock]
        }));
      }
    }
  }

  function removeBlock(blockId: string) {
    canvasStore.update(s => ({
      ...s,
      blocks: s.blocks.filter(block => block.id !== blockId)
    }));
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
    
    ctx.restore();
  }

  onMount(() => {
    ctx = setupCanvas(canvas);
    resizeCanvas(canvas);
    render();

    const handleWindowMouseUp = (event: MouseEvent) => {
      handleBlockDragEnd(event);
    };

    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('resize', () => {
      resizeCanvas(canvas);
      render();
    });

    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  });

  $effect(() => {
    render();
  });

  function handleBlockUpdate(updatedBlock: Block) {
    canvasStore.update(state => ({
      ...state,
      blocks: state.blocks.map(block => 
        block.id === updatedBlock.id ? updatedBlock : block
      )
    }));
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    const data = event.dataTransfer?.getData('text/plain');
    if (data !== 'new-block') return;
    
    const point = getCanvasPoint(event.clientX, event.clientY);
    const newBlock = createBlock(point);
    
    canvasStore.update(s => ({
      ...s,
      blocks: [...s.blocks, newBlock]
    }));
  }
</script>

<div class="relative w-full h-full">
  <canvas
    bind:this={canvas}
    on:mousedown={handleBlockDragStart}
    on:mousemove={handleBlockDragMove}
    on:mouseup={handleBlockDragEnd}
    on:mouseleave={handleBlockDragEnd}
    on:click={handleCanvasClick}
    on:wheel={(e) => {
      e.preventDefault();
      canvasStore.update(s => ({ ...s, ...handleWheel(e, $canvasStore) }));
    }}
    on:dragover={handleDragOver}
    on:drop={handleDrop}
    class="absolute inset-0 cursor-grab active:cursor-grabbing"
  />

  <div 
    class="absolute inset-0"
    style="transform: translate({$canvasStore.offsetX}px, {$canvasStore.offsetY}px) scale({$canvasStore.scale})"
  >
    {#each $canvasStore.blocks as block (block.id)}
      <ApiBlock
        {block}
        onUpdate={handleBlockUpdate}
        onRemove={() => removeBlock(block.id)}
        class="api-block"
      />
    {/each}
  </div>
</div>

<div class="fixed bottom-4 right-4 p-4 bg-white/90 rounded-lg shadow-lg">
  <p class="text-sm text-gray-600">Press Alt + Click to create a new block</p>
  <p class="text-sm text-gray-600">Click and drag empty space to pan</p>
</div>