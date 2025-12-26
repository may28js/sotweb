
import { NewsItem, ServerStatus, ShopItem, GameCharacter } from '../types';
import { SERVER_INFO, NEWS_ITEMS, SHOP_ITEMS } from '../constants';

/**
 * 时光故事 Launcher API 服务
 * 自动检测环境：优先连接真实后端，失败则降级为 Mock 数据。
 */
const IS_PROD = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
const API_BASE_URL = IS_PROD ? '/api' : 'https://api.storyoftime.com/v1';

const simulateLatency = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export class LauncherAPI {
  
  // 统一请求包装，处理 404/500 等情况自动降级
  private static async safeFetch(endpoint: string, fallback: any, options?: RequestInit) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      if (!response.ok) throw new Error('API_UNAVAILABLE');
      return await response.json();
    } catch (e) {
      console.warn(`[API Notice] Endpoint ${endpoint} unavailable, using fallback data.`);
      return fallback;
    }
  }

  static async getServerStatus(): Promise<ServerStatus> {
    return this.safeFetch('/server/status', { 
      ...SERVER_INFO, 
      onlinePlayers: SERVER_INFO.onlinePlayers + Math.floor(Math.random() * 20),
      latency: 15 + Math.floor(Math.random() * 10)
    });
  }

  static async getNews(): Promise<NewsItem[]> {
    return this.safeFetch('/news', NEWS_ITEMS);
  }

  /**
   * 注册新账号 (对接 AzerothCore)
   */
  static async register(payload: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (e) {
      // 演示环境模拟成功
      await simulateLatency(1000);
      return { success: true, message: '（模拟）注册成功！' };
    }
  }

  static async getShopItems(): Promise<ShopItem[]> {
    return this.safeFetch('/shop/items', SHOP_ITEMS);
  }
}
