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
  import { getContext } from 'svelte';

  let { config, onSubmit } = $props<{
    config: ApiBlockConfig;
    onSubmit: (config: ApiBlockConfig) => void;
  }>();

  const sheet = getContext('sheet');
  
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
  let authType = $state(config.authentication?.type || 'none');
  let errorMessage = $state('');
  
  function isDuplicateName(name: string, excludeId?: string): boolean {
    return savedApis.some(api => api.name === name && api.id !== excludeId);
  }

  function isDuplicateConfig(config: Partial<ApiConfig>, excludeId?: string): boolean {
    return savedApis.some(api => {
      if (api.id === excludeId) return false;
      
      return (
        api.endpoint === config.endpoint &&
        api.method === config.method &&
        JSON.stringify(api.headers) === JSON.stringify(config.headers) &&
        api.body === config.body &&
        JSON.stringify(api.queryParams) === JSON.stringify(config.queryParams) &&
        api.timeout === config.timeout &&
        JSON.stringify(api.retryConfig) === JSON.stringify(config.retryConfig) &&
        JSON.stringify(api.authentication) === JSON.stringify(config.authentication) &&
        api.responseType === config.responseType
      );
    });
  }

  function hasChanges(): boolean {
    if (!selectedApiId) return true; // New API, always has changes
    
    const existingApi = savedApis.find(api => api.id === selectedApiId);
    if (!existingApi) return true;

    const currentConfig = {
      name: formData.name,
      endpoint: formData.url,
      method: formData.method,
      headers: formData.headers || {},
      body: formData.body,
      queryParams: formData.queryParams,
      timeout: formData.timeout,
      retryConfig: formData.retryConfig,
      authentication: formData.authentication,
      responseType: formData.responseType
    };

    return (
      existingApi.name !== currentConfig.name ||
      existingApi.endpoint !== currentConfig.endpoint ||
      existingApi.method !== currentConfig.method ||
      JSON.stringify(existingApi.headers) !== JSON.stringify(currentConfig.headers) ||
      existingApi.body !== currentConfig.body ||
      JSON.stringify(existingApi.queryParams) !== JSON.stringify(currentConfig.queryParams) ||
      existingApi.timeout !== currentConfig.timeout ||
      JSON.stringify(existingApi.retryConfig) !== JSON.stringify(currentConfig.retryConfig) ||
      JSON.stringify(existingApi.authentication) !== JSON.stringify(currentConfig.authentication) ||
      existingApi.responseType !== currentConfig.responseType
    );
  }

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
          token: selectedApi.authentication?.token || '',
          key: selectedApi.authentication?.key || '',
          value: selectedApi.authentication?.value || '',
          in: selectedApi.authentication?.in || 'header'
        },
        responseType: selectedApi.responseType || 'json',
        queryParams: selectedApi.queryParams || {}
      };
      
      // Update authType to match the loaded configuration
      authType = selectedApi.authentication?.type || 'none';
      
      updateCurlCommand();
    } catch (error) {
      console.error('Error parsing saved API body:', error);
    }
  }

  async function handleSubmit() {
    isSubmitting = true;
    errorMessage = '';

    try {
      if (!formData.name?.trim()) {
        errorMessage = 'API name is required';
        return;
      }

      // Check if there are any changes when editing
      if (!hasChanges()) {
        sheet?.setOpen(false);
        return;
      }

      if (isDuplicateName(formData.name, selectedApiId)) {
        sheet?.setOpen(false);
        return;
      }

      if (isDuplicateConfig(formData, selectedApiId)) {
        errorMessage = 'An identical API configuration already exists';
        return;
      }

      const apiConfig: Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        endpoint: formData.url,
        method: formData.method,
        headers: formData.headers || {},
        body: formData.body,
        queryParams: formData.queryParams,
        timeout: formData.timeout,
        retryConfig: formData.retryConfig,
        authentication: formData.authentication,
        responseType: formData.responseType
      };

      if (selectedApiId) {
        apiStore.update(selectedApiId, apiConfig);
      } else {
        apiStore.add(apiConfig);
      }

      onSubmit(formData);
    } catch (error) {
      console.error('Error saving API:', error);
      errorMessage = 'Failed to save API configuration';
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
  {#if errorMessage}
    <div class="text-red-500 text-sm font-medium p-2 bg-red-50 rounded-md">{errorMessage}</div>
  {/if}
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