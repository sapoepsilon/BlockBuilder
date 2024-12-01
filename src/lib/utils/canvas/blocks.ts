// lib/utils/canvas/blocks.ts
import type { Block, Point, ApiBlockConfig } from '$lib/types/canvas';

export function createBlock(position: Point): Block {
  // Create a default API block configuration
  const defaultConfig: ApiBlockConfig = {
    method: 'GET',
    url: 'https://api.example.com',
    headers: {
      'Content-Type': 'application/json'
    },
    bodyParams: {},
    queryParams: {},
    responseMapping: {}
  };

  return {
    id: crypto.randomUUID(),
    x: position.x,
    y: position.y,
    width: 300, // Increased width to accommodate API UI
    height: 200, // Increased height to accommodate API UI
    type: 'api', // Specify that this is an API block
    config: defaultConfig
  };
}

export function updateBlockPosition(block: Block, position: Point): Block {
  return {
    ...block,
    x: position.x,
    y: position.y
  };
}

export function isPointInBlock(point: Point, block: Block): boolean {
  return (
    point.x >= block.x &&
    point.x <= block.x + block.width &&
    point.y >= block.y &&
    point.y <= block.height
  );
}

// Add new utility functions for API blocks

export function validateBlockConfig(block: Block): string[] {
  const errors: string[] = [];

  if (!block.config.url) {
    errors.push('URL is required');
  } else {
    try {
      new URL(block.config.url);
    } catch {
      errors.push('Invalid URL format');
    }
  }

  if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(block.config.method)) {
    errors.push('Invalid HTTP method');
  }

  return errors;
}

export function cloneBlock(block: Block): Block {
  return {
    ...block,
    id: crypto.randomUUID(),
    x: block.x + 20, // Offset the clone slightly
    y: block.y + 20,
    config: {
      ...block.config,
      headers: { ...block.config.headers },
      bodyParams: { ...block.config.bodyParams },
      queryParams: { ...block.config.queryParams },
      responseMapping: { ...block.config.responseMapping }
    }
  };
}

export function resizeBlock(block: Block, width: number, height: number): Block {
  return {
    ...block,
    width: Math.max(200, width), // Minimum width
    height: Math.max(150, height) // Minimum height
  };
}

export function updateBlockConfig(block: Block, config: Partial<ApiBlockConfig>): Block {
  return {
    ...block,
    config: {
      ...block.config,
      ...config,
      // Preserve nested objects if not provided in the update
      headers: config.headers ?? block.config.headers,
      bodyParams: config.bodyParams ?? block.config.bodyParams,
      queryParams: config.queryParams ?? block.config.queryParams,
      responseMapping: config.responseMapping ?? block.config.responseMapping
    }
  };
}

// Helper function to get block connections (if implementing block chaining)
export function getConnectedBlocks(block: Block, allBlocks: Block[]): Block[] {
  // This is a placeholder for implementing block connection logic
  // You could add properties to the Block type to track connections
  return allBlocks.filter(b => b.id !== block.id);
}

// Helper function to validate block placement
export function isValidBlockPlacement(
  block: Block,
  allBlocks: Block[],
  canvasWidth: number,
  canvasHeight: number
): boolean {
  // Check if block is within canvas bounds
  if (
    block.x < 0 ||
    block.y < 0 ||
    block.x + block.width > canvasWidth ||
    block.y + block.height > canvasHeight
  ) {
    return false;
  }

  // Check for collisions with other blocks
  // You might want to allow some overlap depending on your requirements
  return !allBlocks.some(
    other =>
      other.id !== block.id &&
      block.x < other.x + other.width &&
      block.x + block.width > other.x &&
      block.y < other.y + other.height &&
      block.y + block.height > other.y
  );
}