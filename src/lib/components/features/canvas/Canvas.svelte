<script lang="ts">
    import { onMount } from 'svelte';
    import { canvasStore } from '$lib/stores/canvas';
    import { setupCanvas, resizeCanvas } from '$lib/utils/canvas/setup';
    import { drawGrid } from '$lib/utils/canvas/draw';
    import { handleMouseMove, handleWheel } from '$lib/utils/canvas/events';
    import type { CanvasProps } from '$lib/types/canvas';
  
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
  
    let { width, height } = $props<CanvasProps>();
  
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
    onmousedown={() => canvasStore.update(s => ({ ...s, isDragging: true }))}
    onmousemove={(e) => {
      canvasStore.update(s => ({ ...s, ...handleMouseMove(e, $canvasStore) }));
    }}
    onmouseup={() => canvasStore.update(s => ({ ...s, isDragging: false }))}
    onmouseleave={() => canvasStore.update(s => ({ ...s, isDragging: false }))}
    onwheel={(e) => {
      e.preventDefault();
      canvasStore.update(s => ({ ...s, ...handleWheel(e, $canvasStore) }));
    }}
    class="cursor-grab active:cursor-grabbing"
  />
  
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