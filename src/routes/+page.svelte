<script lang="ts">
	import Canvas from '$lib/components/features/canvas/Canvas.svelte';
	import ControlPanel from '$lib/components/features/canvas/ControlPanel.svelte';
    import { canvasStore } from '$lib/stores/canvas';
  </script>
  
  <Canvas />
  <ControlPanel {...$canvasStore} />