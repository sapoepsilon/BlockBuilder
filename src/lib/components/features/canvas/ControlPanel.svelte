<!-- lib/components/features/canvas/ControlPanel.svelte -->
<script lang="ts">
  import { canvasStore } from '$lib/stores/canvas';
  import BlockPallete from "./BlockPallete.svelte";
  
  let { mouseX, mouseY, scale, offsetX, offsetY } = $props();
  
  let state = $state({
    isDragging: false,
    panelX: 20,
    panelY: 20,
    dragStartX: 0,
    dragStartY: 0
  });

  function startDrag(event: MouseEvent) {
    if (event.target instanceof HTMLButtonElement) return;
    state.isDragging = true;
    state.dragStartX = event.clientX - state.panelX;
    state.dragStartY = event.clientY - state.panelY;
  }

  function onDrag(event: MouseEvent) {
    if (!state.isDragging) return;
    state.panelX = event.clientX - state.dragStartX;
    state.panelY = event.clientY - state.dragStartY;
  }

  function stopDrag() {
    state.isDragging = false;
  }

  function resetCanvas() {
    canvasStore.update(state => ({
      ...state,
      offsetX: 0,
      offsetY: 0,
      scale: 1
    }));
  }
</script>

<div
  class="fixed flex flex-col gap-4 rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur-sm"
  style="left: {state.panelX}px; top: {state.panelY}px; user-select: none;"
  onmousedown={startDrag}
  onmousemove={onDrag}
  onmouseup={stopDrag}
  onmouseleave={stopDrag}
>
  <div class="flex items-center justify-between">
    <div class="text-sm font-semibold text-gray-800">Canvas Metrics</div>
    <button 
      class="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
      onclick={resetCanvas}
    >
      Reset View
    </button>
  </div>
  
  <div class="space-y-1 text-sm text-gray-600">
    <div class="flex justify-between gap-4">
      <span>Mouse Position:</span>
      <span class="font-mono">X: {mouseX.toFixed(0)}, Y: {mouseY.toFixed(0)}</span>
    </div>
    <div class="flex justify-between gap-4">
      <span>Canvas Offset:</span>
      <span class="font-mono">X: {offsetX.toFixed(0)}, Y: {offsetY.toFixed(0)}</span>
    </div>
    <div class="flex justify-between gap-4">
      <span>Zoom Level:</span>
      <span class="font-mono">{(scale * 100).toFixed(0)}%</span>
    </div>
  </div>
  <div class="h-px bg-gray-200" />
  <BlockPallete />
</div>