<!-- lib/components/features/canvas/BlockPalette.svelte -->
<script lang="ts">
    function handleDragStart(event: DragEvent) {
      if (!event.dataTransfer) return;
      event.dataTransfer.setData('text/plain', 'rectangle');
      event.dataTransfer.effectAllowed = 'copy';
    }
  </script>
  
  <div class="space-y-2">
    <div class="text-sm font-semibold text-gray-800">Blocks</div>
    <div
      class="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-500 text-white shadow-sm hover:bg-blue-600"
      draggable="true"
      on:dragstart={handleDragStart}
    >
      Rectangle
    </div>
  </div>