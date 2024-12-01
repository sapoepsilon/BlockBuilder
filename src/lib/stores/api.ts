import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface ApiConfig {
    id: string;
    name: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: string;
    queryParams?: Record<string, string>;
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
    createdAt: number;
    updatedAt: number;
}

const STORAGE_KEY = 'blockbuilder_apis';

function createApiStore() {
    // Initialize the store with data from localStorage or empty array
    const initialValue = browser 
        ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') 
        : [];
    
    const { subscribe, set, update } = writable<ApiConfig[]>(initialValue);

    return {
        subscribe,
        
        // Add a new API
        add: (api: Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
            update(apis => {
                const newApi: ApiConfig = {
                    ...api,
                    id: crypto.randomUUID(),
                    timeout: api.timeout || 30000,
                    retryConfig: api.retryConfig || { maxRetries: 3, retryDelay: 1000 },
                    authentication: api.authentication || { type: 'none' },
                    responseType: api.responseType || 'json',
                    validateStatus: api.validateStatus || ((status: number) => status >= 200 && status < 300),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };
                const updatedApis = [...apis, newApi];
                if (browser) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedApis));
                }
                return updatedApis;
            });
        },

        // Update an existing API
        update: (id: string, updates: Partial<Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'>>) => {
            update(apis => {
                const updatedApis = apis.map(api => 
                    api.id === id 
                        ? { ...api, ...updates, updatedAt: Date.now() }
                        : api
                );
                if (browser) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedApis));
                }
                return updatedApis;
            });
        },

        // Remove an API
        remove: (id: string) => {
            update(apis => {
                const updatedApis = apis.filter(api => api.id !== id);
                if (browser) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedApis));
                }
                return updatedApis;
            });
        },

        // Clear all APIs
        clear: () => {
            set([]);
            if (browser) {
                localStorage.removeItem(STORAGE_KEY);
            }
        },

        // Generate cURL command for an API configuration
        generateCurl: (api: ApiConfig): string => {
            let command = ['curl'];
            
            // Method
            if (api.method !== 'GET') {
                command.push(`-X ${api.method}`);
            }
            
            // Headers with Content-Type
            const headers = { ...api.headers };
            if (api.method !== 'GET' && !headers['Content-Type']) {
                headers['Content-Type'] = 'application/json';
            }
            
            Object.entries(headers).forEach(([key, value]) => {
                if (key && value) {
                    command.push(`-H "${key}: ${value}"`);
                }
            });
            
            // Authentication
            if (api.authentication) {
                switch (api.authentication.type) {
                    case 'basic':
                        if (api.authentication.username && api.authentication.password) {
                            command.push(`-u "${api.authentication.username}:${api.authentication.password}"`);
                        }
                        break;
                    case 'bearer':
                        if (api.authentication.token) {
                            command.push(`-H "Authorization: Bearer ${api.authentication.token}"`);
                        }
                        break;
                    case 'api-key':
                        if (api.authentication.apiKeyIn === 'header' && api.authentication.apiKeyName && api.authentication.apiKey) {
                            command.push(`-H "${api.authentication.apiKeyName}: ${api.authentication.apiKey}"`);
                        }
                        break;
                }
            }
            
            // Body (with proper JSON formatting)
            if (api.body && api.method !== 'GET') {
                try {
                    // Try to parse and format JSON
                    const jsonBody = JSON.parse(api.body);
                    command.push(`-d '${JSON.stringify(jsonBody)}'`);
                } catch {
                    // If not valid JSON, use as is
                    command.push(`-d '${api.body}'`);
                }
            }
            
            // URL with query parameters
            let url = api.endpoint;
            if (api.queryParams && Object.keys(api.queryParams).length > 0) {
                const params = new URLSearchParams();
                Object.entries(api.queryParams).forEach(([key, value]) => {
                    if (key && value !== undefined && value !== null) {
                        params.append(key, String(value));
                    }
                });
                const queryString = params.toString();
                if (queryString) {
                    url += (url.includes('?') ? '&' : '?') + queryString;
                }
            }
            command.push(`"${url}"`);
            
            return command.join(' ');
        }
    };
}

export const apiStore = createApiStore();
