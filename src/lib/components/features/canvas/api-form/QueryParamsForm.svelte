<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Tabs, TabsContent, TabsList, TabsTrigger} from '$lib/components/ui/tabs';
  import { Textarea } from '$lib/components/ui/textarea';
  import type { ApiBlockConfig } from '$lib/types/apiBlockConfig';
  import { onMount, onDestroy } from 'svelte';
  import { apiStore } from '$lib/stores/api';
  import type { ApiConfig } from '$lib/stores/api';
  import { onNavigate } from '$app/navigation';

  let { formData, updateCurlCommand } = $props<{
    formData: ApiBlockConfig;
    updateCurlCommand: () => void;
  }>();
  
  let jsonEditorContent = $state('');
  let jsonError = $state('');
  let savedApis = $state<ApiConfig[]>([]);
  let unsubscribe: () => void;

  onMount(() => {
    unsubscribe = apiStore.subscribe(apis => {
      savedApis = apis;
      loadSavedData();
    });
  });

  onNavigate(() => {
    loadSavedData();
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  function loadSavedData() {
    if (!formData.name) return;

    const savedApi = savedApis.find(api => api.name === formData.name);
    if (!savedApi) return;

    if (savedApi.queryParams) {
      formData = {
        ...formData,
        queryParams: { ...savedApi.queryParams }
      };
    }

    if (savedApi.body) {
      try {
        const parsedBody = JSON.parse(savedApi.body);
        jsonEditorContent = JSON.stringify(parsedBody, null, 2);
        formData = {
          ...formData,
          body: savedApi.body,
          requestBody: parsedBody
        };
      } catch (e) {
        jsonEditorContent = savedApi.body;
        formData = {
          ...formData,
          body: savedApi.body,
          requestBody: savedApi.body
        };
      }
      updateCurlCommand();
    }
  }

  function addQueryParam() {
    formData = {
      ...formData,
      queryParams: {
        ...formData.queryParams,
        '': ''
      }
    };
    updateCurlCommand();
    saveQueryParams();
  }

  function removeQueryParam(key: string) {
    const { [key]: _, ...rest } = formData.queryParams || {};
    formData = {
      ...formData,
      queryParams: rest
    };
    updateCurlCommand();
    saveQueryParams();
  }

  function saveQueryParams() {
    if (!formData.name) return;

    const savedApi = savedApis.find(api => api.name === formData.name);
    
    if (savedApi) {
      apiStore.update(savedApi.id, {
        queryParams: formData.queryParams
      });
    } else {
      apiStore.add({
        name: formData.name,
        queryParams: formData.queryParams,
        endpoint: '',
        method: 'GET',
        headers: {},
        authentication: { type: 'none' }
      });
    }
  }

  function saveRequestBody() {
    if (!formData.name) return;

    const bodyToSave = typeof formData.requestBody === 'string' 
      ? formData.requestBody 
      : JSON.stringify(formData.requestBody);

    formData = {
      ...formData,
      body: bodyToSave
    };

    const savedApi = savedApis.find(api => api.name === formData.name);
    
    if (savedApi) {
      apiStore.update(savedApi.id, {
        body: bodyToSave
      });
    } else {
      apiStore.add({
        name: formData.name,
        body: bodyToSave,
        endpoint: '',
        method: 'GET',
        headers: {},
        authentication: { type: 'none' }
      });
    }
    updateCurlCommand();
  }

  function updateQueryParam(oldKey: string, newKey: string, value: string) {
    const newParams = { ...formData.queryParams };
    delete newParams[oldKey];
    newParams[newKey] = value;
    
    formData = {
      ...formData,
      queryParams: newParams
    };
    
    updateCurlCommand();
    saveQueryParams();
  }

  function formatJson() {
    try {
      const parsed = JSON.parse(jsonEditorContent);
      jsonEditorContent = JSON.stringify(parsed, null, 2);
      jsonError = '';
      formData = {
        ...formData,
        body: JSON.stringify(parsed),
        requestBody: parsed
      };
      saveRequestBody();
      updateCurlCommand();
    } catch (e) {
      jsonError = 'Invalid JSON format';
    }
  }

  function handleTextareaChange(e: Event) {
    const content = (e.target as HTMLTextAreaElement).value;
    jsonEditorContent = content;
    
    try {
      const parsed = JSON.parse(content);
      jsonError = '';
      formData = {
        ...formData,
        body: content,
        requestBody: parsed
      };
    } catch (e) {
      formData = {
        ...formData,
        body: content,
        requestBody: content
      };
    }
    saveRequestBody();
    updateCurlCommand();
  }

  $effect(() => {
    if (!formData.requestBody) {
      jsonEditorContent = '';
      return;
    }

    try {
      const newContent = typeof formData.requestBody === 'string'
        ? formData.requestBody
        : JSON.stringify(formData.requestBody, null, 2);

      if (newContent !== jsonEditorContent) {
        jsonEditorContent = newContent;
      }
    } catch (e) {
      jsonEditorContent = '';
    }
  });
</script>

<div class="space-y-4">
  <Tabs value="query" class="w-full">
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
              updateQueryParam(key, e.currentTarget.value, value);
            }}
          />
          <Input
            type="text"
            placeholder="Parameter value"
            value={value}
            on:input={(e) => {
              updateQueryParam(key, key, e.currentTarget.value);
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
          class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono" 
          rows={10}
          bind:value={jsonEditorContent}
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