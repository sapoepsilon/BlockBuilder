<script lang="ts">
  import { onMount } from 'svelte';
  import type { Block, ApiBlockConfig } from '$lib/types/canvas';
  import { executeApiCall } from '$lib/services/api';
  import { Button } from '$lib/components/ui/button';
  import { Sheet, SheetHeader } from '$lib/components/ui/sheet';
  import SheetContent from '$lib/components/ui/sheet/sheet-content.svelte';
  import SheetTitle from '$lib/components/ui/sheet/sheet-title.svelte';
  import { X } from 'lucide-svelte';
	import ApiConfigForm from './ApiConfigForm.svelte';
  
  let { 
    block, 
    onUpdate, 
    onRemove 
  } = $props<{
    block: Block;
    onUpdate: (block: Block) => void;
    onRemove: () => void;
  }>();
  
  let showConfigModal = $state(false);
  let isExecuting = $state(false);
  let response = $state<any>(null);
  let error = $state<string | null>(null);
  
  async function handleExecute() {
    isExecuting = true;
    error = null;
    try {
      response = await executeApiCall(block.config);
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      isExecuting = false;
    }
  }
  
  function handleConfigUpdate(newConfig: ApiBlockConfig) {
    onUpdate({
      ...block,
      config: newConfig
    });
    showConfigModal = false;
  }
  
  function handleCloseClick(event: MouseEvent) {
    // Prevent the click from triggering canvas events
    event.preventDefault();
    event.stopPropagation();
    onRemove();
  }
  </script>
  
  <div
    class="absolute p-4 bg-white rounded-lg shadow-lg border-2 border-blue-500 min-w-[200px] min-h-[150px]"
    style="left: {block.x}px; top: {block.y}px; width: {block.width}px; height: {block.height}px;"
  >
    <div class="flex flex-col h-full">
      <div class="flex justify-between items-center mb-2">
        <span class="font-bold text-sm">{block.config.method} Request</span>
        <div class="flex gap-2 items-center">
          <Button
            variant="secondary"
            size="sm"
            onclick={() => showConfigModal = true}
          >
            Configure
          </Button>
          <Button
            variant="default"
            size="sm"
            disabled={isExecuting}
            onclick={handleExecute}
          >
            Execute
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-6 w-6"
            onclick={handleCloseClick}
          >
            <X class="h-4 w-4" />
          </Button>
        </div>
      </div>
  
      <div class="text-xs truncate mb-2">
        {block.config.url}
      </div>
  
      {#if error}
        <div class="text-red-500 text-xs mt-2">
          {error}
        </div>
      {/if}
  
      {#if response}
        <div class="flex-1 overflow-auto text-xs">
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      {/if}
    </div>
  </div>
  
  {#if showConfigModal}
    <Sheet open={showConfigModal} onOpenChange={(open) => showConfigModal = open}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>API Configuration</SheetTitle>
        </SheetHeader>
        <ApiConfigForm
          config={block.config}
          onSubmit={handleConfigUpdate}
        />
      </SheetContent>
    </Sheet>
  {/if}