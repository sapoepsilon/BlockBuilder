import type { ApiBlockConfig } from "./apiBlockConfig";

export interface Block {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'api';
    config: ApiBlockConfig;
  }
  