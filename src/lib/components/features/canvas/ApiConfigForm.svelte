<!-- lib/components/features/canvas/ApiConfigForm.svelte -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Loader2, Copy } from 'lucide-svelte';
  import { apiStore } from '$lib/stores/api';
  import type { ApiConfig } from '$lib/stores/api';
	import type { ApiBlockConfig } from '$lib/types/apiBlockConfig';

  let { config, onSubmit } = $props<{
    config: ApiBlockConfig;
    onSubmit: (config: ApiBlockConfig) => void;
  }>();
  
  let formData = $state<ApiBlockConfig>({ 
    ...config,
    timeout: config.timeout || 30000,
    retryConfig: config.retryConfig || { maxRetries: 3, retryDelay: 1000 },
    authentication: config.authentication || { type: 'none' },
    responseType: config.responseType || 'json'
  });

  let isSubmitting = $state(false);
  let savedApis = $state<ApiConfig[]>([]);
  let showAdvanced = $state(false);
  let curlCommand = $state('');
  
  // Subscribe to the API store
  apiStore.subscribe(apis => {
    savedApis = apis;
  });

  function updateCurlCommand() {
    // Convert ApiBlockConfig to ApiConfig format
    const apiConfig: ApiConfig = {
      id: crypto.randomUUID(), // Temporary ID for cURL generation
      name: formData.name || 'Temporary Config',
      endpoint: formData.url,
      method: formData.method,
      headers: formData.headers || {},
      body: formData.body,
      queryParams: formData.queryParams,
      timeout: formData.timeout,
      retryConfig: formData.retryConfig,
      authentication: formData.authentication,
      responseType: formData.responseType,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    curlCommand = apiStore.generateCurl(apiConfig);
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(curlCommand);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  function loadSavedApi(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selectedApi = savedApis.find(api => api.id === select.value);
    
    if (selectedApi) {
      formData = {
        ...formData,
        name: selectedApi.name,
        url: selectedApi.endpoint,
        method: selectedApi.method,
        headers: selectedApi.headers || {},
        body: selectedApi.body || '',
        authentication: selectedApi.authentication,
        timeout: selectedApi.timeout,
        retryConfig: selectedApi.retryConfig,
        responseType: selectedApi.responseType
      };
      updateCurlCommand();
    }
  }
  
  function addHeader() {
    formData = {
      ...formData,
      headers: {
        ...formData.headers,
        '': ''
      }
    };
    updateCurlCommand();
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
  }
  
  function removeHeader(key: string) {
    const { [key]: _, ...rest } = formData.headers;
    formData = {
      ...formData,
      headers: rest
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
  
  async function handleSubmit(event: Event) {
    event.preventDefault();
    isSubmitting = true;
    try {
      await onSubmit(formData);
    } finally {
      isSubmitting = false;
    }
  }

  $effect(() => {
    if (formData) {
      updateCurlCommand();
    }
  });
</script>
  
<form 
  class="space-y-4 p-4"
  on:submit|preventDefault={handleSubmit}
>
  {#if savedApis.length > 0}
    <div class="space-y-2">
      <label class="block text-sm font-medium">Load Saved API</label>
      <select
        class="w-full p-2 border rounded"
        on:change={loadSavedApi}
      >
        <option value="">Select a saved API...</option>
        {#each savedApis as api}
          <option value={api.id}>{api.name}</option>
        {/each}
      </select>
    </div>
  {/if}

  <div class="space-y-2">
    <label class="block text-sm font-medium">Name</label>
    <Input
      type="text"
      bind:value={formData.name}
      placeholder="My API Configuration"
    />
  </div>

  <div class="space-y-2">
    <label class="block text-sm font-medium">Method</label>
    <select
      bind:value={formData.method}
      class="w-full p-2 border rounded"
    >
      <option value="GET">GET</option>
      <option value="POST">POST</option>
      <option value="PUT">PUT</option>
      <option value="DELETE">DELETE</option>
      <option value="PATCH">PATCH</option>
    </select>
  </div>

  <div class="space-y-2">
    <label class="block text-sm font-medium">URL</label>
    <Input
      type="text"
      bind:value={formData.url}
      placeholder="https://api.example.com/endpoint"
    />
  </div>

  <div class="space-y-2">
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
  </div>

  <div class="space-y-2">
    <label class="block text-sm font-medium">Headers</label>
    {#each Object.entries(formData.headers || {}) as [key, value]}
      <div class="flex gap-2">
        <Input
          type="text"
          placeholder="Header name"
          value={key}
          on:input={(e) => {
            const newHeaders = { ...formData.headers };
            delete newHeaders[key];
            newHeaders[e.currentTarget.value] = value;
            formData = { ...formData, headers: newHeaders };
            updateCurlCommand();
          }}
        />
        <Input
          type="text"
          placeholder="Header value"
          value={value}
          on:input={(e) => {
            formData = {
              ...formData,
              headers: {
                ...formData.headers,
                [key]: e.currentTarget.value
              }
            };
            updateCurlCommand();
          }}
        />
        <Button
          variant="destructive"
          size="sm"
          on:click={() => removeHeader(key)}
          type="button"
        >
          Remove
        </Button>
      </div>
    {/each}
    <Button
      variant="secondary"
      size="sm"
      on:click={addHeader}
      type="button"
    >
      Add Header
    </Button>
  </div>

  <div class="space-y-2">
    <label class="block text-sm font-medium">Authentication</label>
    <select
      bind:value={formData.authentication.type}
      class="w-full p-2 border rounded"
      on:change={updateCurlCommand}
    >
      <option value="none">None</option>
      <option value="basic">Basic Auth</option>
      <option value="bearer">Bearer Token</option>
      <option value="api-key">API Key</option>
    </select>

    {#if formData.authentication.type === 'basic'}
      <div class="space-y-2">
        <Input
          type="text"
          placeholder="Username"
          bind:value={formData.authentication.username}
          on:input={updateCurlCommand}
        />
        <Input
          type="password"
          placeholder="Password"
          bind:value={formData.authentication.password}
          on:input={updateCurlCommand}
        />
      </div>
    {:else if formData.authentication.type === 'bearer'}
      <Input
        type="text"
        placeholder="Bearer Token"
        bind:value={formData.authentication.token}
        on:input={updateCurlCommand}
      />
    {:else if formData.authentication.type === 'api-key'}
      <div class="space-y-2">
        <Input
          type="text"
          placeholder="API Key Name"
          bind:value={formData.authentication.apiKeyName}
          on:input={updateCurlCommand}
        />
        <Input
          type="text"
          placeholder="API Key Value"
          bind:value={formData.authentication.apiKey}
          on:input={updateCurlCommand}
        />
        <select
          bind:value={formData.authentication.apiKeyIn}
          class="w-full p-2 border rounded"
          on:change={updateCurlCommand}
        >
          <option value="header">Header</option>
          <option value="query">Query Parameter</option>
        </select>
      </div>
    {/if}
  </div>

  <Button
    variant="secondary"
    type="button"
    on:click={() => showAdvanced = !showAdvanced}
  >
    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
  </Button>

  {#if showAdvanced}
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="block text-sm font-medium">Response Type</label>
        <select
          bind:value={formData.responseType}
          class="w-full p-2 border rounded"
        >
          <option value="json">JSON</option>
          <option value="text">Text</option>
          <option value="blob">Blob</option>
          <option value="arraybuffer">Array Buffer</option>
        </select>
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium">Timeout (ms)</label>
        <Input
          type="number"
          bind:value={formData.timeout}
          placeholder="30000"
        />
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium">Retry Configuration</label>
        <div class="flex gap-2">
          <Input
            type="number"
            bind:value={formData.retryConfig.maxRetries}
            placeholder="Max Retries"
          />
          <Input
            type="number"
            bind:value={formData.retryConfig.retryDelay}
            placeholder="Retry Delay (ms)"
          />
        </div>
      </div>

      {#if formData.method !== 'GET'}
        <div class="space-y-2">
          <label class="block text-sm font-medium">Request Body</label>
          <textarea
            class="w-full p-2 border rounded"
            rows="4"
            bind:value={formData.body}
            on:input={updateCurlCommand}
            placeholder="Request body (JSON)"
          />
        </div>
      {/if}
    </div>
  {/if}

  {#if curlCommand}
    <div class="space-y-2 bg-gray-100 p-4 rounded">
      <div class="flex justify-between items-center mb-2">
        <label class="block text-sm font-medium">cURL Command</label>
        <Button
          variant="ghost"
          size="sm"
          on:click={copyToClipboard}
          class="hover:bg-gray-200"
        >
          <Copy class="w-4 h-4 mr-1" />
          Copy
        </Button>
      </div>
      <div class="bg-white p-3 rounded border">
        <pre class="text-sm overflow-x-auto whitespace-pre-wrap break-all">{curlCommand}</pre>
      </div>
    </div>
  {/if}

  <div class="flex justify-end">
    <Button type="submit" disabled={isSubmitting}>
      {#if isSubmitting}
        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
        <span>Saving...</span>
      {:else}
        Save Configuration
      {/if}
    </Button>
  </div>
</form>