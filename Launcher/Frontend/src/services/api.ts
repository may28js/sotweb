import type { NewsItem, ShopItem, PatchNoteItem, LauncherConfig, ServerStatus } from '../types';

// Placeholder for VPS API URL
let API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://shiguanggushi.xyz/api';
let ENABLE_MOCK = false;

// Load config from public/config.json
const loadConfig = async () => {
  try {
    const response = await fetch('/config.json');
    if (response.ok) {
      const config = await response.json();
      if (config.apiBaseUrl) API_BASE_URL = config.apiBaseUrl;
      if (typeof config.enableMockData === 'boolean') ENABLE_MOCK = config.enableMockData;
    }
  } catch (e) {
    console.warn("Failed to load config.json, using defaults", e);
  }
};

// Initialize config loading
loadConfig();

export const launcherService = {
  getConfig: async (): Promise<LauncherConfig> => {
    // Always try to fetch config, fall back if fails
    try {
      const response = await fetch(`${API_BASE_URL}/Launcher/config`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      // Silent failure for config to avoid console spam when API is not ready
      // console.warn("Fetch config failed", e);
    }
    // Fallback
    return {
      realmlist: "38.55.125.89",
      websiteUrl: "https://shiguanggushi.xyz",
      registerUrl: "https://shiguanggushi.xyz/register",
      latestVersion: "1.0.0",
      downloadUrl: ""
    };
  },

  getStatus: async (): Promise<ServerStatus> => {
    // Disabled as requested by user to remove status display and errors
    return { status: 'Offline', onlinePlayers: 0, maxPlayers: 1000, uptime: 'N/A' };
    /*
    if (ENABLE_MOCK) return { status: 'Online', onlinePlayers: 1234, maxPlayers: 5000, uptime: '1d 2h' };
    try {
      const response = await fetch(`${API_BASE_URL}/Launcher/status`);
      if (response.ok) return await response.json();
    } catch (e) {
      console.warn("Fetch status failed", e);
    }
    return { status: 'Offline', onlinePlayers: 0, maxPlayers: 1000, uptime: 'N/A' };
    */
  }
};

export const authService = {
  login: async (username: string, password: string): Promise<string> => {
    if (ENABLE_MOCK) {
      // Mock login delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return "mock_token_123456";
    }

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || '登录失败');
      }

      const token = await response.text();
      return token;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    if (ENABLE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { username, email };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/Auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password }),
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || '注册失败');
        }
  
        return await response.json();
    } catch (error) {
        console.error('Registration failed:', error);
        throw error;
    }
  }
};

export const newsService = {
  getNews: async (): Promise<NewsItem[]> => {
    if (ENABLE_MOCK) {
      return MOCK_NEWS;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/News`);
      if (!response.ok) {
        throw new Error('获取新闻失败');
      }
      const data = await response.json();
      
      // Map Backend News to Frontend NewsItem
      return data.map((item: any) => ({
        id: item.id.toString(),
        tag: item.type || '新闻',
        title: item.title,
        desc: item.content ? item.content.substring(0, 100) + (item.content.length > 100 ? '...' : '') : '',
        image: item.thumbnail || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2671&auto=format&fit=crop', // Fallback image
        date: new Date(item.createdAt).toLocaleDateString()
      }));
    } catch (error) {
      console.error('Fetch news failed:', error);
      // Fallback to mock on error? Or just rethrow?
      // For now, let's return mock if fetch fails to keep UI stable, but log error
      console.warn("Falling back to mock data due to error");
      return MOCK_NEWS;
    }
  }
};

export const shopService = {
  getShopItems: async (): Promise<ShopItem[]> => {
    // Mock for now
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_SHOP_ITEMS;
  }
};

export const patchNoteService = {
  getPatchNotes: async (): Promise<PatchNoteItem[]> => {
    // Mock for now
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_PATCH_NOTES;
  }
};

// Mock Data
const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    tag: '新闻',
    title: 'PVP 第8赛季：愤怒的角斗士',
    desc: '竞技场第8赛季即将结算。请各位角斗士做好准备，龙类坐骑和称号将在1月5日发放。',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2671&auto=format&fit=crop',
    date: '2024-12-10'
  },
  {
    id: '2',
    tag: '社区',
    title: '社区精选：最美幻化大赛',
    desc: '本月的主题是“时光漫游者”。展示你最复古的装备搭配，赢取海量积分奖励。',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=2670&auto=format&fit=crop',
    date: '2024-12-08'
  }
];

const MOCK_SHOP_ITEMS: ShopItem[] = [
    {
      id: '1',
      title: "奥之灰烬",
      desc: "解锁这只传奇的飞行坐骑，在天空中留下火焰的轨迹。",
      price: 50,
      originalPrice: 100,
      currency: 'gem',
      image: "https://wow.zamimg.com/uploads/screenshots/normal/68427-ashes-of-alar.jpg",
      tags: ['坐骑', '全服通用'],
      discount: 50,
      featured: true
    },
    {
      id: '2',
      title: "阵营转换服务",
      desc: "改变你的角色阵营（联盟/部落）。包含一次免费的种族变更。",
      price: 1000,
      originalPrice: 1176,
      currency: 'vote',
      image: "https://bnetcmsus-a.akamaihd.net/cms/blog_header/2g/2G40356549211624992563.jpg",
      tags: ['角色服务', '全服通用'],
      discount: 15,
      featured: true
    },
    {
      id: '3',
      title: "10,000 金币",
      desc: "立即获得 10,000 金币。仅限选定的服务器和角色。",
      price: 250,
      currency: 'gem',
      image: "https://wow.zamimg.com/uploads/screenshots/normal/872410-pile-of-gold.jpg",
      tags: ['货币', '单角色'],
    },
    {
      id: '4',
      title: "直升 80 级",
      desc: "将你的角色等级立即提升至 80 级。赠送全套 200 装等装备。",
      price: 5000,
      currency: 'vote',
      image: "https://bnetcmsus-a.akamaihd.net/cms/blog_header/x8/X8J3M07954931666133285.jpg",
      tags: ['角色服务', 'WLK 专区'],
    },
    {
      id: '5',
      title: "无敌的缰绳",
      desc: "阿尔萨斯·米奈希尔的传奇坐骑。",
      price: 300,
      currency: 'gem',
      image: "https://wow.zamimg.com/uploads/screenshots/normal/169992-invincibles-reins.jpg",
      tags: ['坐骑', '稀有'],
    },
    {
      id: '6',
      title: "幻化：大元帅",
      desc: "解锁大元帅/高阶督军的经典PVP外观幻化权限。",
      price: 1500,
      currency: 'vote',
      image: "https://wow.zamimg.com/uploads/screenshots/normal/75945-grand-marshals-claymore.jpg",
      tags: ['幻化', '账号共享'],
    }
];

const MOCK_PATCH_NOTES: PatchNoteItem[] = [
  { 
    version: "Ver 3.3.5a.12", 
    date: "12-14",
    content: "修复了[时光之穴]斯坦索姆副本中阿尔萨斯有时会卡住的BUG。",
    highlight: true
  },
  { 
    version: "Ver 3.3.5a.11", 
    date: "12-12",
    content: "调整了奥杜尔[米米尔隆]困难模式的伤害数值，使其更符合当前版本装等。"
  },
  { 
    version: "Ver 3.3.5a.10", 
    date: "12-09",
    content: "为了保持阵营平衡，暂时开启免费转阵营服务。"
  }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  getNews: async (): Promise<NewsItem[]> => {
    if (!ENABLE_MOCK) {
        try {
            const response = await fetch(`${API_BASE_URL}/news`);
            if (response.ok) return await response.json();
        } catch (e) {
            console.error("API Error (getNews):", e);
        }
    }
    await delay(500);
    return MOCK_NEWS;
  },

  getShopItems: async (): Promise<ShopItem[]> => {
    if (!ENABLE_MOCK) {
        try {
            const response = await fetch(`${API_BASE_URL}/shop`);
            if (response.ok) return await response.json();
        } catch (e) {
            console.error("API Error (getShopItems):", e);
        }
    }
    await delay(800);
    return MOCK_SHOP_ITEMS;
  },

  getPatchNotes: async (): Promise<PatchNoteItem[]> => {
    if (!ENABLE_MOCK) {
        try {
            const response = await fetch(`${API_BASE_URL}/patch-notes`);
            if (response.ok) return await response.json();
        } catch (e) {
            console.error("API Error (getPatchNotes):", e);
        }
    }
    await delay(300);
    return MOCK_PATCH_NOTES;
  }
};
