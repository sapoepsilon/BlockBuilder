// lib/services/api.ts

import type { ApiBlockConfig } from "$lib/types/apiBlockConfig";

class ApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public response?: any,
        public config?: ApiBlockConfig
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function parseResponse(response: Response, responseType: string = 'json') {
    try {
        switch (responseType) {
            case 'json':
                return await response.json();
            case 'text':
                return await response.text();
            case 'blob':
                return await response.blob();
            case 'arraybuffer':
                return await response.arrayBuffer();
            default:
                return await response.json();
        }
    } catch (error) {
        throw new ApiError(
            `Failed to parse response as ${responseType}`,
            response.status,
            error
        );
    }
}

// Store logs for each API call
const apiLogs: Record<string, string[]> = {};

export function getApiLogs(blockId: string): string[] {
    return apiLogs[blockId] || [];
}

export async function executeApiCall(config: ApiBlockConfig) {
    const retryConfig = config.retryConfig || { maxRetries: 3, retryDelay: 1000 };
    let attempt = 0;

    if (!config.blockId) {
        console.warn('No blockId provided in config');
        return;
    }

    // Initialize logs array for this block if it doesn't exist
    if (!apiLogs[config.blockId]) {
        apiLogs[config.blockId] = [];
    }
    
    // Clear previous logs for this block
    apiLogs[config.blockId] = [];

    const addLog = (message: string, details?: any) => {
        const logMessage = details 
            ? `${message}\n${JSON.stringify(details, null, 2)}`
            : message;
        apiLogs[config.blockId].push(`${new Date().toISOString()}: ${logMessage}`);
    };

    while (attempt <= retryConfig.maxRetries) {
        try {
            addLog(`Starting API call attempt ${attempt + 1}/${retryConfig.maxRetries + 1}`, {
                url: config.url,
                method: config.method
            });
            
            const url = new URL(config.url);
            
            // Add query parameters
            if (config.queryParams) {
                addLog('Adding query parameters', config.queryParams);
                Object.entries(config.queryParams).forEach(([key, value]) => {
                    // Add a check to ensure value is not undefined
                    if (value !== undefined) {
                        url.searchParams.append(key, value.toString());
                    }
                });
            }

            // Prepare headers
            const headers = new Headers(config.headers || {});
            
            // Handle authentication
            if (config.authentication) {
                switch (config.authentication.type) {
                    case 'basic':
                        if (config.authentication.username && config.authentication.password) {
                            const credentials = btoa(`${config.authentication.username}:${config.authentication.password}`);
                            headers.set('Authorization', `Basic ${credentials}`);
                            addLog('Adding basic authentication');
                        }
                        break;
                    case 'bearer':
                        if (config.authentication.token) {
                            headers.set('Authorization', `Bearer ${config.authentication.token}`);
                            addLog('Adding bearer token authentication');
                        }
                        break;
                    case 'api-key':
                        if (config.authentication.key && config.authentication.value) {
                            if (config.authentication.in === 'header') {
                                headers.set(config.authentication.key, config.authentication.value);
                                addLog('Adding API key authentication in header');
                            } else if (config.authentication.in === 'query') {
                                url.searchParams.append(config.authentication.key, config.authentication.value);
                                addLog('Adding API key authentication in query parameters');
                            }
                        }
                        break;
                }
            }

            // Prepare request configuration
            const requestConfig: RequestInit = {
                method: config.method,
                headers,
            };

            // Handle both string body and requestBody object
            if (config.body || config.requestBody) {
                const bodyContent = config.body || (config.requestBody ? JSON.stringify(config.requestBody) : undefined);
                if (bodyContent) {
                    addLog('Request body', config.requestBody || JSON.parse(config.body));
                    requestConfig.body = bodyContent;
                    
                    // Set content-type header if not already set
                    if (!headers.has('content-type')) {
                        headers.set('content-type', 'application/json');
                    }
                }
            }

            addLog('Making fetch request', {
                url: url.toString(),
                method: config.method,
                headers: Object.fromEntries(headers.entries())
            });

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), config.timeout || 30000);
            
            const response = await fetch(url.toString(), {
                ...requestConfig,
                signal: controller.signal,
            });
            
            clearTimeout(timeout);

            if (!response.ok) {
                addLog(`Request failed with status ${response.status}`, {
                    statusText: response.statusText
                });
                throw new ApiError(
                    `Request failed with status ${response.status}`,
                    response.status,
                    await response.text(),
                    config
                );
            }

            // Parse response based on type
            const result = await parseResponse(response, config.responseType);
            addLog(`Request successful`, {
                status: response.status,
                responseType: config.responseType
            });
            
            return result;

        } catch (error) {
            console.error(`❌ Attempt ${attempt + 1} failed:`, error);
            addLog(`Attempt ${attempt + 1} failed: ${error.message}`);
            
            // Don't retry if it's a timeout or validation error
            if (
                error instanceof ApiError ||
                error instanceof TypeError ||
                attempt >= retryConfig.maxRetries
            ) {
                throw error;
            }

            // Wait before retrying
            await delay(retryConfig.retryDelay);
            attempt++;
        }
    }
}