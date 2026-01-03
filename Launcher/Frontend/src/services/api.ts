import type { NewsItem, ShopItem, PatchNoteItem } from '../types';

// Placeholder for VPS API URL
let API_BASE_URL = 'https://api.storyoftime.com/v1'; // Default fallback
let ENABLE_MOCK = true;

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
