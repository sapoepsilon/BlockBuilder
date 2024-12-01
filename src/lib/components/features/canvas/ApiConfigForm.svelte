<!-- lib/components/features/canvas/ApiConfigForm.svelte -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Loader2 } from 'lucide-svelte';
  import { apiStore } from '$lib/stores/api';
  import type { ApiConfig } from '$lib/stores/api';
  import type { ApiBlockConfig } from '$lib/types/apiBlockConfig';
  import AuthenticationForm from './api-form/AuthenticationForm.svelte';
  import HeadersForm from './api-form/HeadersForm.svelte';

  import AdvancedOptionsForm from './api-form/AdvancedOptionsForm.svelte';
  import CurlCommandDisplay from './api-form/CurlCommandDisplay.svelte';
	import QueryParamsForm from './api-form/QueryParamsForm.svelte';

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
  
  async function handleSubmit(event: Event) {
    event.preventDefault();
    isSubmitting = true;
    try {
      await onSubmit(formData);
    } finally {
      isSubmitting = false;
    }
  }

  let authType = $derived(formData.authentication?.type ?? 'none');

  $effect(() => {
    if (formData) {
      updateCurlCommand();
    }
  });
</script>
  
<form 
  class="space-y-4 h-full overflow-y-auto pr-4"
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

  <div class="space-y-2 px-2">
    <label class="block text-sm font-medium">Name</label>
    <Input
      type="text"
      bind:value={formData.name}
      placeholder="My API Configuration"
    />
  </div>

  <div class="space-y-2 px-2">
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

  <div class="space-y-2 px-2">
    <label class="block text-sm font-medium">URL</label>
    <Input
      type="text"
      bind:value={formData.url}
      placeholder="https://api.example.com/endpoint"
    />
  </div>

  <QueryParamsForm {formData} {updateCurlCommand} />
  <HeadersForm {formData} {updateCurlCommand} />
  <AuthenticationForm {formData} {authType} {updateCurlCommand} />

  <Button
    variant="secondary"
    type="button"
    on:click={() => showAdvanced = !showAdvanced}
  >
    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
  </Button>

  {#if showAdvanced}
    <AdvancedOptionsForm {formData} {updateCurlCommand} />
  {/if}

  <CurlCommandDisplay {curlCommand} />

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