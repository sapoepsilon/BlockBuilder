<!-- lib/components/features/canvas/Block.svelte -->
<script lang="ts">
    import type { Block } from '$lib/types/canvas';
    
    let { id, x, y, width, height, onDragStart } = $props<Block & {
      onDragStart: (e: DragEvent) => void;
    }>();
  </script>
  
  <div
    draggable="true"
    on:dragstart={onDragStart}
    class="absolute bg-blue-500 cursor-move"
    style="left: {x}px; top: {y}px; width: {width}px; height: {height}px;"
  >
    <div class="h-full w-full" />
  </div>