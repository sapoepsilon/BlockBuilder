<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import ResizableWindow from "$lib/components/ui/resizable-window/ResizableWindow.svelte";
  import * as Select from "$lib/components/ui/select";
  import { Search, Download, Filter, Trash2 } from "lucide-svelte";
  import * as Resizable from "$lib/components/ui/resizable";
	import Header from "../../../../stories/Header.svelte";
  export let open = false;
  export let apiLogs: string[] = [];

  let searchQuery = "";
  let filterType: "all" | "error" | "info" | "success" = "all";
  let sortOrder: "newest" | "oldest" = "newest";

  // Create selected objects for the selects
  $: selectedFilter = {
    value: filterType,
    label: filterType.charAt(0).toUpperCase() + filterType.slice(1)
  };

  $: selectedSort = {
    value: sortOrder,
    label: sortOrder === "newest" ? "Newest First" : "Oldest First"
  };

  $: filteredLogs = apiLogs
    .filter((log) => {
      const matchesSearch = log.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === "all" 
        ? true 
        : filterType === "error" 
          ? log.toLowerCase().includes("error") || log.toLowerCase().includes("failed")
          : filterType === "success"
            ? log.toLowerCase().includes("success") || log.toLowerCase().includes("completed")
            : true;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.split(":")[0]);
      const dateB = new Date(b.split(":")[0]);
      return sortOrder === "newest" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

  function downloadLogs() {
    const content = apiLogs.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function clearLogs() {
    apiLogs = [];
  }

  function getLogStyle(log: string): string {
    if (log.toLowerCase().includes("error") || log.toLowerCase().includes("failed")) {
      return "text-red-500 bg-red-50 dark:bg-red-950/50";
    }
    if (log.toLowerCase().includes("success") || log.toLowerCase().includes("completed")) {
      return "text-green-500 bg-green-50 dark:bg-green-950/50";
    }
    return "text-muted-foreground";
  }
</script>

<ResizableWindow
  bind:open
  title="API Logs"
  defaultWidth={800}
  defaultHeight={600}
  minWidth={400}
  minHeight={300}
>
  <div class="space-y-4 p-6">
    <div class="flex items-center gap-4">
      <div class="flex-1">
        <div class="relative">
          <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search logs..."
            class="pl-8"
            bind:value={searchQuery}
          />
        </div>
      </div>

      <Select.Root
      selected={selectedFilter}
      onSelectedChange={(selected) => {
        if (selected) filterType = selected.value;
      }}
    >
      <Select.Trigger class="w-32">
        <Filter class="mr-2 h-4 w-4" />
        <Select.Value placeholder="Filter" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="all" label="All Logs" />
        <Select.Item value="error" label="Errors" />
        <Select.Item value="success" label="Success" />
        <Select.Item value="info" label="Info" />
      </Select.Content>
    </Select.Root>

    <Select.Root
      selected={selectedSort}
      onSelectedChange={(selected) => {
        if (selected) sortOrder = selected.value;
      }}
    >
      <Select.Trigger class="w-32">
        <Select.Value placeholder="Sort" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="newest" label="Newest First" />
        <Select.Item value="oldest" label="Oldest First" />
      </Select.Content>
    </Select.Root>

      <div class="flex gap-2">
        <Button variant="outline" on:click={downloadLogs}>
          <Download class="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button variant="outline" on:click={() => (apiLogs = [])}>
          <Trash2 class="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>

    <div class="h-[400px] rounded-md border bg-muted p-4 overflow-auto font-mono text-sm">
      {#each filteredLogs as log}
        <div class="whitespace-pre-wrap {getLogStyle(log)}">
          {log}
        </div>
      {/each}
    </div>
  </div>
</ResizableWindow>