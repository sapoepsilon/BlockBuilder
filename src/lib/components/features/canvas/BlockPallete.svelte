<!-- lib/components/features/canvas/BlockPallete.svelte -->
<script lang="ts">
  import { createBlock } from '$lib/utils/canvas/blocks';
  import { canvasStore } from '$lib/stores/canvas';
  import type { Point } from '$lib/types/canvas';

  let dragState = $state({
    isDragging: false,
    draggedBlock: null as any,
    dragOffset: { x: 0, y: 0 } as Point
  });

  function handleDragStart(event: DragEvent) {
    if (!event.dataTransfer) return;
    
    event.dataTransfer.setData('text/plain', 'new-block');
    event.dataTransfer.effectAllowed = 'move';
    
    dragState.isDragging = true;
    dragState.dragOffset = {
      x: event.offsetX,
      y: event.offsetY
    };
  }

  function handleDragEnd() {
    dragState.isDragging = false;
    dragState.draggedBlock = null;
  }
</script>

<div class="flex flex-col gap-2">
  <div class="text-sm font-semibold text-gray-800">Block Palette</div>
  <div 
    class="w-32 h-16 bg-white border-2 border-dashed border-gray-300 rounded cursor-move"
    draggable="true"
    on:dragstart={handleDragStart}
    on:dragend={handleDragEnd}
  >
    <div class="flex items-center justify-center h-full text-sm text-gray-500">
      API Block
    </div>
  </div>
</div>