<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";

  export let savedApis: Array<{ id: string; name: string }> = [];
  export let onLoadApi: (apiId: string) => void;
  export let onDeleteApi: (apiId: string) => void;
  export let onEditApi: (apiId: string) => void;

  let isOpen = false;
  let selectedApisToDelete: string[] = [];

  function toggleApiSelection(apiId: string) {
    if (selectedApisToDelete.includes(apiId)) {
      selectedApisToDelete = selectedApisToDelete.filter(id => id !== apiId);
    } else {
      selectedApisToDelete = [...selectedApisToDelete, apiId];
    }
  }

  function handleDeleteSelected() {
    selectedApisToDelete.forEach(apiId => {
      onDeleteApi(apiId);
    });
    selectedApisToDelete = [];
  }
</script>

{#if savedApis.length > 0}
  <div class="space-y-2" on:click={(event) => event.stopPropagation()}>
    <button
      type="button"
      class="w-full flex justify-between items-center py-2 text-sm font-medium hover:bg-gray-50 rounded"
      on:click={(event) => {
        event.stopPropagation();
        isOpen = !isOpen;
      }}
      aria-expanded={isOpen}
    >
      <span>Load Saved API</span>
      <svg
        class="w-5 h-5 transform transition-transform {isOpen ? 'rotate-180' : ''}"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    
    {#if isOpen}
      <div class="space-y-2">
        {#if selectedApisToDelete.length > 0}
          <div class="flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              on:click={(event) => {
                event.stopPropagation();
                handleDeleteSelected();
              }}
            >
              Delete Selected ({selectedApisToDelete.length})
            </Button>
          </div>
        {/if}
        <div class="space-y-2">
          {#each savedApis as api}
            <div class="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedApisToDelete.includes(api.id)}
                on:change={(event) => {
                  event.stopPropagation();
                  toggleApiSelection(api.id);
                }}
                class="h-4 w-4"
              />
              <button
                type="button"
                class="flex-grow text-left p-2 hover:bg-gray-100 rounded"
                on:click={(event) => {
                  event.stopPropagation();
                  onLoadApi(api.id);
                }}
              >
                {api.name}
              </button>
              <div class="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  on:click={(event) => {
                    event.stopPropagation();
                    onEditApi(api.id);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  on:click={(event) => {
                    event.stopPropagation();
                    onDeleteApi(api.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}
