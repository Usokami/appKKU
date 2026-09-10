import type { TarotApi } from '../preload/preload';

declare global {
  interface Window {
    tarotApi: TarotApi;
  }
}

export {};
