
export enum GameState {
  CHECKING_FILES = 'CHECKING_FILES',     // Startup scan
  NOT_INSTALLED = 'NOT_INSTALLED',       // No client found
  CLIENT_FOUND = 'CLIENT_FOUND',         // Found existing installation
  DOWNLOADING_CLIENT = 'DOWNLOADING_CLIENT', // Full client download (P2P)
  DOWNLOADING_PATCHES = 'DOWNLOADING_PATCHES', // Small updates (HTTP)
  PAUSED = 'PAUSED',
  READY = 'READY',
  PLAYING = 'PLAYING'
}

export interface NewsItem {
  id: string;
  title: string;
  category: '新闻' | '活动' | '热修' | '社区';
  date: string;
  imageUrl: string;
  summary: string;
}

export interface UpdateLogItem {
  id: string;
  version: string;
  date: string;
  content: string;
  isHot: boolean;
}

export interface ServerStatus {
  isOnline: boolean;
  onlinePlayers: number;
  realmName: string;
  latency: number;
}

export interface DownloadProgress {
  taskName: string;
  totalSize: number; // in MB
  downloaded: number; // in MB
  speed: number; // in MB/s
  percentage: number;
  peers?: number; // For P2P simulation
}

export enum AppTab {
  GAMES = 'GAMES',
  SOCIAL = 'SOCIAL',
  SHOP = 'SHOP',
  NEWS = 'NEWS',
  PLAN = 'PLAN' 
}

// --- Shop & Economy Types ---

export type ShopCategory = 'featured' | 'mounts' | 'pets' | 'services' | 'cosmetics';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number; // In Time Coins
  category: ShopCategory;
  imageUrl: string;
  isHot?: boolean;
  isNew?: boolean;
}

export interface CartItem extends ShopItem {
  quantity: number;
}

export interface GameCharacter {
  guid: number;
  name: string;
  level: number;
  race: string;
  class: string;
}

export enum PaymentMethod {
  ALIPAY = 'Alipay',
  WECHAT = 'WeChat',
  PAYPAL = 'PayPal'
}

// Interface for WebView2 Communication
export interface WebViewBridge {
  postMessage: (message: any) => void;
}

declare global {
  interface Window {
    chrome?: {
      webview?: WebViewBridge;
    };
  }
}
