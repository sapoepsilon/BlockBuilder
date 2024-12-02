<script lang="ts">
    import { Textarea } from '$lib/components/ui/textarea';
    import type { ApiBlockConfig } from '$lib/types/apiBlockConfig';
  
    export let formData: ApiBlockConfig;
    export let updateCurlCommand: () => void;
  
    // Initialize jsonEditorContent as a writable store
    let jsonEditorContent = '';
    let jsonError = '';
  
    // Create a reactive statement to update jsonEditorContent when formData changes
    $: {
      if (formData.requestBody) {
        try {
          const content = typeof formData.requestBody === 'string' 
            ? formData.requestBody 
            : JSON.stringify(formData.requestBody, null, 2);
          if (content !== jsonEditorContent) {
            jsonEditorContent = content;
            formData = {
              ...formData,
              body: typeof formData.requestBody === 'string' 
                ? formData.requestBody 
                : JSON.stringify(formData.requestBody)
            };
          }
        } catch (e) {
          jsonEditorContent = '';
        }
      } else {
        jsonEditorContent = '';
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
  </script>
  
  <div class="space-y-2">
    <label class="block text-sm font-medium">Request Body (JSON)</label>
    <Textarea
      rows={10}
      class="font-mono"
      bind:value={jsonEditorContent}
      on:input={handleTextareaChange}
    />
    {#if jsonError}
      <p class="text-sm text-red-500">{jsonError}</p>
    {/if}
  </div>