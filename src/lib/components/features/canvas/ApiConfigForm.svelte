<!-- ApiConfigForm.svelte -->
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
  import { onMount } from 'svelte';
  import SavedApisList from './SavedApisList.svelte';
  import { Collapsible } from '$lib/components/ui/collapsible';

  let { config, onSubmit } = $props<{
    config: ApiBlockConfig;
    onSubmit: (config: ApiBlockConfig) => void;
  }>();
  
  let formData = $state<ApiBlockConfig>({ 
    ...config,
    timeout: config.timeout || 30000,
    retryConfig: config.retryConfig || { maxRetries: 3, retryDelay: 1000 },
    authentication: {
      type: config.authentication?.type || 'none',
      username: config.authentication?.username || '',
      password: config.authentication?.password || '',
      token: config.authentication?.token || '',
      in: config.authentication?.in || 'header'
    },
    responseType: config.responseType || 'json',
    body: config.body || '',
    requestBody: config.body ? JSON.parse(config.body) : undefined,
    headers: config.headers || {},
    queryParams: config.queryParams || {}
  });

  let isSubmitting = $state(false);
  let savedApis = $state<ApiConfig[]>([]);
  let showAdvanced = $state(false);
  let curlCommand = $state('');
  let selectedApiId = $state<string>('');
  let isEditing = $state(false);
  let selectedApisToDelete = $state<string[]>([]);
  let isOpen = $state(false);
  
  onMount(() => {
    const unsubscribe = apiStore.subscribe(apis => {
      savedApis = apis;
    });

    return () => unsubscribe();
  });

  function updateCurlCommand() {
    const apiConfig: ApiConfig = {
      id: crypto.randomUUID(),
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
    selectedApiId = select.value;
    const selectedApi = savedApis.find(api => api.id === selectedApiId);
    
    if (!selectedApi) return;

    try {
      const parsedBody = selectedApi.body ? JSON.parse(selectedApi.body) : undefined;
      
      formData = {
        name: selectedApi.name,
        url: selectedApi.endpoint,
        method: selectedApi.method,
        headers: selectedApi.headers || {},
        body: selectedApi.body || '',
        requestBody: parsedBody,
        timeout: selectedApi.timeout || 30000,
        retryConfig: {
          maxRetries: selectedApi.retryConfig?.maxRetries ?? 3,
          retryDelay: selectedApi.retryConfig?.retryDelay ?? 1000
        },
        authentication: {
          type: selectedApi.authentication?.type || 'none',
          username: selectedApi.authentication?.username || '',
          password: selectedApi.authentication?.password || '',
          token: selectedApi.authentication?.token || ''
        },
        responseType: selectedApi.responseType || 'json',
        queryParams: selectedApi.queryParams || {}
      };
      
      updateCurlCommand();
    } catch (error) {
      console.error('Error parsing saved API body:', error);
    }
  }

  async function handleSubmit() {
    isSubmitting = true;
    try {
      const apiConfig: Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name || 'Untitled API',
        endpoint: formData.url,
        method: formData.method,
        headers: formData.headers,
        body: formData.body,
        queryParams: formData.queryParams,
        timeout: formData.timeout,
        retryConfig: formData.retryConfig,
        authentication: formData.authentication,
        responseType: formData.responseType
      };

      if (isEditing && selectedApiId) {
        await apiStore.update(selectedApiId, apiConfig);
        isEditing = false;
      } else {
        await apiStore.add(apiConfig);
      }
      selectedApiId = '';
      onSubmit(formData);
    } catch (error) {
      console.error('Error saving API config:', error);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleDelete(apiId: string) {
    if (confirm('Are you sure you want to delete this API configuration?')) {
      await apiStore.remove(apiId);
      if (selectedApiId === apiId) {
        selectedApiId = '';
      }
      selectedApisToDelete = selectedApisToDelete.filter(id => id !== apiId);
    }
  }

  async function handleDeleteSelected() {
    if (selectedApisToDelete.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedApisToDelete.length} API configuration(s)?`)) {
      for (const apiId of selectedApisToDelete) {
        await apiStore.remove(apiId);
        if (selectedApiId === apiId) {
          selectedApiId = '';
        }
      }
      selectedApisToDelete = [];
    }
  }

  function toggleApiSelection(apiId: string) {
    if (selectedApisToDelete.includes(apiId)) {
      selectedApisToDelete = selectedApisToDelete.filter(id => id !== apiId);
    } else {
      selectedApisToDelete = [...selectedApisToDelete, apiId];
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
    <SavedApisList
      {savedApis}
      onLoadApi={(apiId) => {
        selectedApiId = apiId;
        loadSavedApi({ target: { value: apiId } } as any);
      }}
      onEditApi={(apiId) => {
        isEditing = true;
        selectedApiId = apiId;
        loadSavedApi({ target: { value: apiId } } as any);
      }}
      onDeleteApi={handleDelete}
    />
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

  <QueryParamsForm 
    {formData} 
    {updateCurlCommand} 
  />
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