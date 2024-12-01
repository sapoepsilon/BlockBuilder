// lib/services/api.ts
import type { ApiBlockConfig } from '$lib/types/canvas';

export async function executeApiCall(config: ApiBlockConfig) {
  const url = new URL(config.url);
  
  // Add query parameters
  if (config.queryParams) {
    Object.entries(config.queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    method: config.method,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers
    },
    body: config.method !== 'GET' && config.bodyParams 
      ? JSON.stringify(config.bodyParams)
      : undefined
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // Apply response mapping if configured
  if (config.responseMapping) {
    return Object.entries(config.responseMapping).reduce((mapped, [key, path]) => {
      mapped[key] = path.split('.').reduce((obj, key) => obj?.[key], data);
      return mapped;
    }, {} as Record<string, any>);
  }

  return data;
}