export interface ApiBlockConfig {
    name?: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers: Record<string, string>;
    body?: string;
    queryParams?: Record<string, any>;
    responseMapping?: Record<string, string>;
    timeout?: number;
    retryConfig?: {
      maxRetries: number;
      retryDelay: number;
    };
    authentication?: {
      type: 'none' | 'basic' | 'bearer' | 'api-key';
      username?: string;
      password?: string;
      token?: string;
      apiKey?: string;
      apiKeyName?: string;
      apiKeyIn?: 'header' | 'query';
    };
    responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
    validateStatus?: (status: number) => boolean;
  }