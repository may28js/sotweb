
import { NewsItem, ServerStatus, ShopItem, GameCharacter } from '../types';
import { SERVER_INFO, NEWS_ITEMS, SHOP_ITEMS } from '../constants';

const IS_PROD = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
// 生产环境下，Nginx 会将 /api 转发到 localhost:3000
const API_BASE_URL = IS_PROD ? '/api' : 'http://localhost:3000/api';

export class LauncherAPI {
  
  private static async safeFetch(endpoint: string, fallback: any) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000); // 5秒超时

      const response = await fetch(`${API_BASE_URL}${endpoint}`, { signal: controller.signal });
      clearTimeout(id);

      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      return await response.json();
    } catch (e) {
      console.warn(`[API] ${endpoint} 无法连接，使用预设数据。内容:`, e);
      return fallback;
    }
  }

  static async getServerStatus(): Promise<ServerStatus> {
    return this.safeFetch('/server/status', SERVER_INFO);
  }

  static async getNews(): Promise<NewsItem[]> {
    return this.safeFetch('/news', NEWS_ITEMS);
  }

  /**
   * 注册账号逻辑
   */
  static async register(payload: any) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000); // 注册给10秒时间

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(id);

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '服务器内部错误');
      return data;
    } catch (e: any) {
      clearTimeout(id);
      console.error('Register Error:', e);
      return { 
        success: false, 
        message: e.name === 'AbortError' ? '请求超时，请检查后端 API Bridge 是否运行' : e.message 
      };
    }
  }
}
