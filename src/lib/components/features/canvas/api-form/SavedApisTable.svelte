<script lang="ts">
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { ArrowUpDown } from "lucide-svelte";
  import type { ApiConfig } from "$lib/stores/api";

  export let savedApis: ApiConfig[] = [];
  export let onLoadApi: (api: ApiConfig) => void;

  // Filtering
  let filterValue = "";
  $: filteredApis = savedApis.filter(api => 
    api.name.toLowerCase().includes(filterValue.toLowerCase()) ||
    api.endpoint.toLowerCase().includes(filterValue.toLowerCase()) ||
    api.method.toLowerCase().includes(filterValue.toLowerCase())
  );

  // Sorting
  let sortColumn: keyof ApiConfig | null = null;
  let sortDirection: 'asc' | 'desc' = 'asc';

  function toggleSort(column: keyof ApiConfig) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
  }

  $: sortedApis = [...filteredApis].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    if (aVal instanceof Date && bVal instanceof Date) {
      return sortDirection === 'asc'
        ? aVal.getTime() - bVal.getTime()
        : bVal.getTime() - aVal.getTime();
    }
    
    return 0;
  });

  // Pagination
  let pageSize = 5;
  let currentPage = 0;

  $: totalPages = Math.ceil(sortedApis.length / pageSize);
  $: paginatedApis = sortedApis.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  function nextPage() {
    if (currentPage < totalPages - 1) currentPage++;
  }

  function previousPage() {
    if (currentPage > 0) currentPage--;
  }

  // Column visibility
  let visibleColumns = {
    name: true,
    method: true,
    endpoint: true,
    updatedAt: true
  };
</script>

{#if savedApis.length > 0}
  <div class="space-y-4">
    <div class="flex items-center py-4">
      <Input
        class="max-w-sm"
        placeholder="Filter APIs..."
        type="text"
        bind:value={filterValue}
      />
    </div>

    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {#if visibleColumns.name}
              <TableHead>
                <Button variant="ghost" on:click={() => toggleSort('name')}>
                  Name
                  <ArrowUpDown class="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            {/if}
            {#if visibleColumns.method}
              <TableHead>Method</TableHead>
            {/if}
            {#if visibleColumns.endpoint}
              <TableHead>Endpoint</TableHead>
            {/if}
            {#if visibleColumns.updatedAt}
              <TableHead>
                <Button variant="ghost" on:click={() => toggleSort('updatedAt')}>
                  Last Updated
                  <ArrowUpDown class="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            {/if}
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each paginatedApis as api}
            <TableRow>
              {#if visibleColumns.name}
                <TableCell>{api.name}</TableCell>
              {/if}
              {#if visibleColumns.method}
                <TableCell>{api.method}</TableCell>
              {/if}
              {#if visibleColumns.endpoint}
                <TableCell class="max-w-xs truncate">{api.endpoint}</TableCell>
              {/if}
              {#if visibleColumns.updatedAt}
                <TableCell>{new Date(api.updatedAt).toLocaleDateString()}</TableCell>
              {/if}
              <TableCell>
                <Button
                  variant="default"
                  size="sm"
                  on:click={() => onLoadApi(api)}
                >
                  Load
                </Button>
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </div>

    <div class="flex items-center justify-between py-4">
      <div class="text-sm text-muted-foreground">
        Showing {Math.min(currentPage * pageSize + 1, sortedApis.length)} to {Math.min((currentPage + 1) * pageSize, sortedApis.length)} of {sortedApis.length} entries
      </div>
      <div class="space-x-2">
        <Button
          variant="outline"
          size="sm"
          on:click={previousPage}
          disabled={currentPage === 0}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          on:click={nextPage}
          disabled={currentPage === totalPages - 1}
        >
          Next
        </Button>
      </div>
    </div>
  </div>
{/if}
