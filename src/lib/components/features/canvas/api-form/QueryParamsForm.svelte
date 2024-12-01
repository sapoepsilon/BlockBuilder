<!-- QueryParamsForm.svelte -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Tabs, TabsContent, TabsList, TabsTrigger} from '$lib/components/ui/tabs';
  import { Textarea } from '$lib/components/ui/textarea';
  import type { ApiBlockConfig } from '$lib/types/apiBlockConfig';

  export let formData: ApiBlockConfig;
  export let updateCurlCommand: () => void;

  let jsonEditorContent = '';
  let jsonError = '';

  function addQueryParam() {
    formData = {
      ...formData,
      queryParams: {
        ...formData.queryParams,
        '': ''
      }
    };
    updateCurlCommand();
  }

  function removeQueryParam(key: string) {
    const { [key]: _, ...rest } = formData.queryParams || {};
    formData = {
      ...formData,
      queryParams: rest
    };
    updateCurlCommand();
  }

  function formatJson() {
    try {
      const parsed = JSON.parse(jsonEditorContent);
      jsonEditorContent = JSON.stringify(parsed, null, 2);
      jsonError = '';
      formData = {
        ...formData,
        requestBody: parsed
      };
      updateCurlCommand();
    } catch (e) {
      jsonError = 'Invalid JSON format';
    }
  }

  $: {
    if (formData.requestBody) {
      try {
        jsonEditorContent = JSON.stringify(formData.requestBody, null, 2);
      } catch (e) {
        jsonEditorContent = '';
      }
    }
  }
</script>

<div class="space-y-4">
  <Tabs value="query"  class="w-full">
    <TabsList>
      <TabsTrigger value="query">Query Parameters</TabsTrigger>
      <TabsTrigger value="body">Request Body</TabsTrigger>
    </TabsList>

    <TabsContent value="query" class="space-y-2 px-2">
      <label class="block text-sm font-medium">Query Parameters</label>
      {#each Object.entries(formData.queryParams || {}) as [key, value]}
        <div class="flex gap-2">
          <Input
            type="text"
            placeholder="Parameter name"
            value={key}
            on:input={(e) => {
              const newParams = { ...formData.queryParams };
              delete newParams[key];
              newParams[e.currentTarget.value] = value;
              formData = { ...formData, queryParams: newParams };
              updateCurlCommand();
            }}
          />
          <Input
            type="text"
            placeholder="Parameter value"
            value={value}
            on:input={(e) => {
              formData = {
                ...formData,
                queryParams: {
                  ...formData.queryParams,
                  [key]: e.currentTarget.value
                }
              };
              updateCurlCommand();
            }}
          />
          <Button
            variant="destructive"
            size="sm"
            on:click={() => removeQueryParam(key)}
            type="button"
          >
            Remove
          </Button>
        </div>
      {/each}
      <Button
        variant="secondary"
        size="sm"
        on:click={addQueryParam}
        type="button"
      >
        Add Query Parameter
      </Button>
    </TabsContent>

    <TabsContent value="body" class="space-y-2 px-2">
      <div class="space-y-2">
        <label class="block text-sm font-medium">Request Body (JSON)</label>
      <Textarea
          rows={10}
          class="font-mono"
          bind:value={jsonEditorContent}
          on:change={formatJson}
        />
        {#if jsonError}
          <p class="text-sm text-red-500">{jsonError}</p>
        {/if}
        <Button
          variant="secondary"
          size="sm"
          on:click={formatJson}
          type="button"
        >
          Format JSON
        </Button>
      </div>
    </TabsContent>
  </Tabs>
</div>
