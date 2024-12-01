// lib/services/api.ts
import type { ApiBlockConfig } from '$lib/types/canvas';

export async function executeApiCall(config: ApiBlockConfig) {
  console.log('🚀 Starting API call with config:', config);
  
  const url = new URL(config.url);
  
  // Add query parameters
  if (config.queryParams) {
    console.log('📝 Adding query parameters:', config.queryParams);
    Object.entries(config.queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const requestConfig = {
    method: config.method,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers
    },
    body: config.method !== 'GET' && config.bodyParams 
      ? JSON.stringify(config.bodyParams)
      : undefined
  };

  console.log('📡 Making fetch request to:', url.toString());
  console.log('⚙️ Request configuration:', {
    method: requestConfig.method,
    headers: requestConfig.headers,
    bodyParams: config.bodyParams
  });

  try {
    const response = await fetch(url.toString(), requestConfig);
    console.log('📥 Received response status:', response.status);
    console.log('📤 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorMessage = `HTTP error! status: ${response.status}`;
      console.error('❌ Request failed:', errorMessage);
      throw new Error(errorMessage);
    }

    // Check content type to determine how to parse the response
    const contentType = response.headers.get('content-type');
    console.log('📋 Response content type:', contentType);

    let parsedResponse: any;
    try {
      if (contentType?.includes('application/json')) {
        parsedResponse = await response.json();
        console.log('✅ Parsed JSON response:', parsedResponse);
      } else if (contentType?.includes('text/')) {
        parsedResponse = await response.text();
        console.log('✅ Parsed text response:', parsedResponse);
      } else {
        parsedResponse = await response.text();
        console.log('✅ Parsed unknown content type as text:', parsedResponse);
      }

      // Apply response mapping if configured
      if (config.responseMapping && typeof parsedResponse === 'object') {
        console.log('🔄 Applying response mapping:', config.responseMapping);
        const mappedResponse = Object.entries(config.responseMapping).reduce((mapped, [key, path]) => {
          const value = path.split('.').reduce((obj, key) => obj?.[key], parsedResponse);
          if (value !== undefined) {
            mapped[key] = value;
          }
          return mapped;
        }, {} as Record<string, any>);
        console.log('🎯 Mapped response:', mappedResponse);
        return Object.keys(mappedResponse).length > 0 ? mappedResponse : parsedResponse;
      }

      return parsedResponse;
    } catch (parseError) {
      console.error('❌ Failed to parse response:', parseError);
      throw new Error(`Failed to parse response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('❌ Request error:', error);
    throw error;
  }
}