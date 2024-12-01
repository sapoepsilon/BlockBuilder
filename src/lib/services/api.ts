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

export async function executeApiCall(config: ApiBlockConfig) {
    const retryConfig = config.retryConfig || { maxRetries: 3, retryDelay: 1000 };
    let attempt = 0;

    while (attempt <= retryConfig.maxRetries) {
        try {
            console.log(`🚀 Starting API call attempt ${attempt + 1}/${retryConfig.maxRetries + 1}`, config);
            
            const url = new URL(config.url);
            
            // Add query parameters
            if (config.queryParams) {
                Object.entries(config.queryParams).forEach(([key, value]) => {
                    url.searchParams.append(key, String(value));
                });
            }

            // Prepare headers with authentication
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...config.headers
            };

            if (config.authentication) {
                switch (config.authentication.type) {
                    case 'basic':
                        const credentials = btoa(`${config.authentication.username}:${config.authentication.password}`);
                        headers['Authorization'] = `Basic ${credentials}`;
                        break;
                    case 'bearer':
                        headers['Authorization'] = `Bearer ${config.authentication.token}`;
                        break;
                    case 'api-key':
                        if (config.authentication.apiKeyIn === 'header') {
                            headers[config.authentication.apiKeyName || 'X-API-Key'] = config.authentication.apiKey || '';
                        } else if (config.authentication.apiKeyIn === 'query') {
                            url.searchParams.append(
                                config.authentication.apiKeyName || 'apiKey',
                                config.authentication.apiKey || ''
                            );
                        }
                        break;
                }
            }

            const requestConfig = {
                method: config.method,
                headers,
                body: config.method !== 'GET' && config.body 
                    ? config.body
                    : undefined,
                signal: config.timeout 
                    ? AbortSignal.timeout(config.timeout)
                    : undefined
            };

            console.log('📡 Making fetch request to:', url.toString());
            console.log('⚙️ Request configuration:', {
                method: requestConfig.method,
                headers: requestConfig.headers,
                body: config.body
            });

            const response = await fetch(url.toString(), requestConfig);
            
            // Validate response status
            const validateStatus = config.validateStatus || ((status: number) => status >= 200 && status < 300);
            if (!validateStatus(response.status)) {
                throw new ApiError(
                    `Request failed with status ${response.status}`,
                    response.status,
                    await parseResponse(response, config.responseType),
                    config
                );
            }

            // Parse response based on type
            const result = await parseResponse(response, config.responseType);
            console.log('✅ Request successful:', { status: response.status, data: result });
            return result;

        } catch (error) {
            console.error(`❌ Attempt ${attempt + 1} failed:`, error);
            
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