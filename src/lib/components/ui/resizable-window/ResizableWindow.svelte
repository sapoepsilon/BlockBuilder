<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Maximize2, Minimize2, X } from 'lucide-svelte';
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  export let open = false;
  export let title = '';
  export let minWidth = 400;
  export let minHeight = 300;
  export let defaultWidth = 600;
  export let defaultHeight = 400;

  const dispatch = createEventDispatcher();

  let isMaximized = false;
  let isDragging = false;
  let isResizing = false;
  let resizeDirection = '';
  
  let windowEl: HTMLDivElement;
  let startX: number;
  let startY: number;
  let startWidth: number;
  let startHeight: number;
  let startLeft: number;
  let startTop: number;

  let windowPosition = {
    x: Math.max(0, (window.innerWidth - defaultWidth) / 2),
    y: Math.max(0, (window.innerHeight - defaultHeight) / 2),
    width: defaultWidth,
    height: defaultHeight
  };

  let previousPosition = { ...windowPosition };

  function startDrag(e: MouseEvent) {
    if (e.target instanceof HTMLElement && e.target.closest('.resize-handle, button')) return;
    isDragging = true;
    startX = e.clientX - windowPosition.x;
    startY = e.clientY - windowPosition.y;
  }

  function startResize(e: MouseEvent, direction: string) {
    isResizing = true;
    resizeDirection = direction;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = windowPosition.width;
    startHeight = windowPosition.height;
    startLeft = windowPosition.x;
    startTop = windowPosition.y;
  }

  function handleMouseMove(e: MouseEvent) {
    if (isDragging && !isMaximized) {
      windowPosition.x = Math.min(
        Math.max(0, e.clientX - startX),
        window.innerWidth - windowPosition.width
      );
      windowPosition.y = Math.min(
        Math.max(0, e.clientY - startY),
        window.innerHeight - windowPosition.height
      );
    } else if (isResizing && !isMaximized) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (resizeDirection.includes('e')) {
        windowPosition.width = Math.max(minWidth, startWidth + dx);
      }
      if (resizeDirection.includes('s')) {
        windowPosition.height = Math.max(minHeight, startHeight + dy);
      }
      if (resizeDirection.includes('w')) {
        const newWidth = Math.max(minWidth, startWidth - dx);
        if (newWidth !== windowPosition.width) {
          windowPosition.x = startLeft + startWidth - newWidth;
          windowPosition.width = newWidth;
        }
      }
      if (resizeDirection.includes('n')) {
        const newHeight = Math.max(minHeight, startHeight - dy);
        if (newHeight !== windowPosition.height) {
          windowPosition.y = startTop + startHeight - newHeight;
          windowPosition.height = newHeight;
        }
      }
    }
  }

  function handleMouseUp() {
    isDragging = false;
    isResizing = false;
  }

  function toggleMaximize() {
    if (isMaximized) {
      windowPosition = { ...previousPosition };
    } else {
      previousPosition = { ...windowPosition };
      windowPosition = {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
    isMaximized = !isMaximized;
  }

  function close() {
    open = false;
    dispatch('close');
  }
</script>

<svelte:window 
  on:mousemove={handleMouseMove} 
  on:mouseup={handleMouseUp}
/>

{#if open}
<div
  class="fixed inset-0 bg-black/50 z-50"
  transition:fade={{ duration: 200 }}
  on:click={close}
/>

<div
  bind:this={windowEl}
  class="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
  style="
    left: {windowPosition.x}px;
    top: {windowPosition.y}px;
    width: {windowPosition.width}px;
    height: {windowPosition.height}px;
    {isMaximized ? 'transform: none;' : ''}
  "
  transition:fade={{ duration: 200, easing: cubicOut }}
>
  <!-- Window header -->
  <div
    class="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-900 cursor-move select-none"
    on:mousedown={startDrag}
  >
    <div class="text-sm font-medium">{title}</div>
    <div class="flex items-center space-x-2">
      <button
        class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        on:click={toggleMaximize}
      >
        {#if isMaximized}
          <Minimize2 class="w-4 h-4" />
        {:else}
          <Maximize2 class="w-4 h-4" />
        {/if}
      </button>
      <button
        class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        on:click={close}
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>

  <!-- Window content -->
  <div class="overflow-auto" style="height: calc(100% - 40px);">
    <slot />
  </div>

  <!-- Resize handles -->
  {#if !isMaximized}
    <div class="resize-handle resize-e" on:mousedown={(e) => startResize(e, 'e')} />
    <div class="resize-handle resize-s" on:mousedown={(e) => startResize(e, 's')} />
    <div class="resize-handle resize-w" on:mousedown={(e) => startResize(e, 'w')} />
    <div class="resize-handle resize-n" on:mousedown={(e) => startResize(e, 'n')} />
    <div class="resize-handle resize-ne" on:mousedown={(e) => startResize(e, 'ne')} />
    <div class="resize-handle resize-nw" on:mousedown={(e) => startResize(e, 'nw')} />
    <div class="resize-handle resize-se" on:mousedown={(e) => startResize(e, 'se')} />
    <div class="resize-handle resize-sw" on:mousedown={(e) => startResize(e, 'sw')} />
  {/if}
</div>
{/if}

<style>
  .resize-handle {
    position: absolute;
    background: transparent;
  }
  .resize-e {
    top: 0;
    right: 0;
    width: 4px;
    height: 100%;
    cursor: e-resize;
  }
  .resize-s {
    bottom: 0;
    left: 0;
    width: 100%;
    height: 4px;
    cursor: s-resize;
  }
  .resize-w {
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    cursor: w-resize;
  }
  .resize-n {
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    cursor: n-resize;
  }
  .resize-ne {
    top: 0;
    right: 0;
    width: 8px;
    height: 8px;
    cursor: ne-resize;
  }
  .resize-nw {
    top: 0;
    left: 0;
    width: 8px;
    height: 8px;
    cursor: nw-resize;
  }
  .resize-se {
    bottom: 0;
    right: 0;
    width: 8px;
    height: 8px;
    cursor: se-resize;
  }
  .resize-sw {
    bottom: 0;
    left: 0;
    width: 8px;
    height: 8px;
    cursor: sw-resize;
  }
</style>
