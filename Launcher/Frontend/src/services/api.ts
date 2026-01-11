import type { NewsItem, ShopItem, PatchNoteItem, LauncherConfig, ServerStatus, User, CartItem } from '../types';

// Placeholder for VPS API URL
let API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://shiguanggushi.xyz/api';
let RESOURCE_BASE_URL = 'https://shiguanggushi.xyz';
let ENABLE_MOCK = false;

// Load config from public/config.json
const loadConfig = async () => {
  try {
    const response = await fetch('/config.json');
    if (response.ok) {
      const config = await response.json();
      
      // Update RESOURCE_BASE_URL from config if present
      if (config.apiBaseUrl) {
          try {
             const url = new URL(config.apiBaseUrl);
             RESOURCE_BASE_URL = url.origin;
          } catch(e) { /* ignore */ }
      }

      // In DEV, keep API_BASE_URL as '/api' to use Vite proxy and avoid CORS
      if (config.apiBaseUrl && !import.meta.env.DEV) API_BASE_URL = config.apiBaseUrl;
      
      if (typeof config.enableMockData === 'boolean') ENABLE_MOCK = config.enableMockData;
    }
  } catch (e) {
    console.warn("Failed to load config.json, using defaults", e);
  }
};

export const cartService = {
  getCart: async (token: string): Promise<CartItem[]> => {
    if (ENABLE_MOCK) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/Cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) return await response.json();
        if (response.status === 404) return [];
        return [];
    } catch (e) {
        console.error("Cart fetch failed", e);
        return [];
    }
  },

  addToCart: async (token: string, itemId: number, quantity: number): Promise<void> => {
    if (ENABLE_MOCK) return;
    try {
        await fetch(`${API_BASE_URL}/Cart/add`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ shopItemId: itemId, quantity })
        });
    } catch (e) { console.error("Add to cart failed", e); }
  },

  removeFromCart: async (token: string, itemId: number): Promise<void> => {
    if (ENABLE_MOCK) return;
    try {
        await fetch(`${API_BASE_URL}/Cart/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (e) { console.error("Remove from cart failed", e); }
  },

  clearCart: async (token: string): Promise<void> => {
    if (ENABLE_MOCK) return;
    try {
        await fetch(`${API_BASE_URL}/Cart/clear`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (e) { console.error("Clear cart failed", e); }
  }
};

// Initialize config loading
loadConfig();

// Helper to strip HTML tags
const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<\/?[^>]+(>|$)/g, "");
};

export const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  // Use RESOURCE_BASE_URL which is always absolute
  const baseUrl = RESOURCE_BASE_URL.endsWith('/') ? RESOURCE_BASE_URL.slice(0, -1) : RESOURCE_BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

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

      const data = await response.json();
      return data.token;
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
  },

  getMe: async (token: string): Promise<User> => {
    if (ENABLE_MOCK) {
       await new Promise(resolve => setTimeout(resolve, 500));
       return { id: 1, username: "TimeWalker", email: "test@example.com", points: 999, accessLevel: 1 };
    }
    try {
        const response = await fetch(`${API_BASE_URL}/Auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        console.log("[API] GetMe Response:", data);
        // Handle PascalCase from backend if necessary
        return {
            id: data.id || data.Id,
            username: data.username || data.Username,
            email: data.email || data.Email,
            points: data.points !== undefined ? data.points : (data.Points !== undefined ? data.Points : 0),
            accessLevel: data.accessLevel !== undefined ? data.accessLevel : (data.AccessLevel !== undefined ? data.AccessLevel : 0)
        };
    } catch (error) {
        console.error("GetMe failed", error);
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
      return data.map((item: any) => {
        const cleanContent = stripHtml(item.content || '');
        return {
          id: item.id.toString(),
          tag: item.type || '新闻',
          title: item.title,
          desc: cleanContent.substring(0, 100) + (cleanContent.length > 100 ? '...' : ''),
          image: getImageUrl(item.thumbnail) || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2671&auto=format&fit=crop', // Fallback image
          date: new Date(item.createdAt).toLocaleDateString()
        };
      });
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
  getShopItems: () => api.getShopItems(),
  getMyCharacters: (token: string) => api.getMyCharacters(token),
  purchaseItem: (token: string, itemId: number, characterName: string, quantity: number = 1) => api.purchaseItem(token, itemId, characterName, quantity),
  purchaseBulk: (token: string, items: { itemId: number; quantity: number }[], characterName: string) => api.purchaseBulk(token, items, characterName),
  recharge: (token: string, amount: number) => api.recharge(token, amount)
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
      id: 1,
      name: "奥之灰烬",
      description: "解锁这只传奇的飞行坐骑，在天空中留下火焰的轨迹。",
      price: 50,
      originalPrice: 100,
      currency: 'gem',
      iconUrl: "https://wow.zamimg.com/uploads/screenshots/normal/68427-ashes-of-alar.jpg",
      category: '坐骑',
      discount: 50,
      featured: true
    },
    {
      id: 2,
      name: "阵营转换服务",
      description: "改变你的角色阵营（联盟/部落）。包含一次免费的种族变更。",
      price: 1000,
      originalPrice: 1176,
      currency: 'vote',
      iconUrl: "https://bnetcmsus-a.akamaihd.net/cms/blog_header/2g/2G40356549211624992563.jpg",
      category: '服务',
      discount: 15,
      featured: true
    },
    {
      id: 3,
      name: "10,000 金币",
      description: "立即获得 10,000 金币。仅限选定的服务器和角色。",
      price: 250,
      currency: 'gem',
      iconUrl: "https://wow.zamimg.com/uploads/screenshots/normal/872410-pile-of-gold.jpg",
      category: '货币',
    },
    {
      id: 4,
      name: "直升 80 级",
      description: "将你的角色等级立即提升至 80 级。赠送全套 200 装等装备。",
      price: 5000,
      currency: 'vote',
      iconUrl: "https://bnetcmsus-a.akamaihd.net/cms/blog_header/x8/X8J3M07954931666133285.jpg",
      category: '服务',
    },
    {
      id: 5,
      name: "无敌的缰绳",
      description: "阿尔萨斯·米奈希尔的传奇坐骑。",
      price: 300,
      currency: 'gem',
      iconUrl: "https://wow.zamimg.com/uploads/screenshots/normal/169992-invincibles-reins.jpg",
      category: '坐骑',
    },
    {
      id: 6,
      name: "幻化：大元帅",
      description: "解锁大元帅/高阶督军的经典PVP外观幻化权限。",
      price: 1500,
      currency: 'vote',
      iconUrl: "https://wow.zamimg.com/uploads/screenshots/normal/75945-grand-marshals-claymore.jpg",
      category: '幻化',
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
            const response = await fetch(`${API_BASE_URL}/Store/items`);
            if (response.ok) return await response.json();
        } catch (e) {
            console.error("API Error (getShopItems):", e);
        }
    }
    await delay(800);
    return MOCK_SHOP_ITEMS;
  },

  getMyCharacters: async (token: string): Promise<import('../types').Character[]> => {
    if (!ENABLE_MOCK) {
        try {
            const response = await fetch(`${API_BASE_URL}/Store/my-characters`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) return await response.json();
            if (response.status === 401) throw new Error("Unauthorized");
        } catch (e) {
            console.error("API Error (getMyCharacters):", e);
            throw e;
        }
    }
    await delay(500);
    return [
        { name: "TimeWalker", race: 1, class: 1, level: 80, gender: 0 },
        { name: "ChronoMage", race: 4, class: 8, level: 60, gender: 1 }
    ];
  },

  purchaseItem: async (token: string, itemId: number, characterName: string, quantity: number = 1): Promise<any> => {
    if (!ENABLE_MOCK) {
        try {
            const response = await fetch(`${API_BASE_URL}/Store/purchase/${itemId}?characterName=${characterName}&quantity=${quantity}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "购买失败");
            }
            return await response.json();
        } catch (e) {
            console.error("API Error (purchaseItem):", e);
            throw e;
        }
    }
    await delay(1000);
    return { success: true, message: `Successfully purchased item ${itemId} for ${characterName}` };
  },

  purchaseBulk: async (token: string, items: { itemId: number; quantity: number }[], characterName: string): Promise<any> => {
    if (!ENABLE_MOCK) {
      try {
        // Use PascalCase for backend compatibility
        // Log payload for debugging
        const payload = { 
          CharacterName: characterName, 
          Items: items.map(i => ({ Id: i.itemId, Quantity: i.quantity })) 
        };
        console.log("[API] Purchase Bulk Payload:", payload);

        const response = await fetch(`${API_BASE_URL}/Store/purchase/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || "批量购买失败");
        }
        return await response.json();
      } catch (e) {
        console.error("API Error (purchaseBulk):", e);
        throw e;
      }
    }
    await delay(1000);
    return { success: true, message: `Successfully purchased ${items.length} items for ${characterName}` };
  },

  recharge: async (token: string, amount: number): Promise<{ payLink?: string, message?: string }> => {
    if (!ENABLE_MOCK) {
        try {
            const response = await fetch(`${API_BASE_URL}/Payment/recharge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Recharge failed');
            }
            return data;
        } catch (e) {
             console.error("API Error (recharge):", e);
             throw e;
        }
    }
    await delay(1000);
    return { payLink: 'https://example.com/mock-payment' };
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
