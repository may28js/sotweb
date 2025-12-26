
import { NewsItem, ServerStatus, UpdateLogItem, ShopItem, GameCharacter } from './types';

export const SERVER_INFO: ServerStatus = {
  isOnline: true,
  onlinePlayers: 3420,
  realmName: "时光故事",
  latency: 32
};

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: '1',
    title: '时光回溯：冬幕节的起源',
    category: '活动',
    date: '2024-12-15',
    imageUrl: 'https://wow.zamimg.com/uploads/screenshots/normal/206981-winter-veil.jpg', 
    summary: '克罗米发现了一个时间裂隙，冬幕节的庆祝活动似乎发生了一些奇妙的变化。在铁炉堡和奥格瑞玛寻找时间守护者领取特殊任务。'
  },
  {
    id: '2',
    title: 'PVP 第8赛季：愤怒的角斗士',
    category: '新闻',
    date: '2024-12-10',
    imageUrl: 'https://picsum.photos/id/1033/600/300',
    summary: '竞技场第8赛季即将结算。请各位角斗士做好准备，龙类坐骑和称号将在1月5日发放。'
  },
  {
    id: '3',
    title: '社区精选：最美幻化大赛',
    category: '社区',
    date: '2024-12-05',
    imageUrl: 'https://picsum.photos/id/106/600/300',
    summary: '本月的主题是“时光漫游者”。展示你最复古的装备搭配，赢取海量积分奖励。'
  },
  {
    id: '4',
    title: '晶红圣殿：即将开放',
    category: '新闻',
    date: '2024-12-01',
    imageUrl: 'https://picsum.photos/id/1015/600/300',
    summary: '红龙军团的圣地正遭受威胁。集结你的盟友，准备面对海里昂的怒火。'
  }
];

export const UPDATE_LOGS: UpdateLogItem[] = [
  {
    id: 'u1',
    version: 'Ver 3.3.5a.12',
    date: '12-14',
    content: '修复了[时光之穴]斯坦索姆副本中阿尔萨斯有时会卡住的BUG。',
    isHot: true
  },
  {
    id: 'u2',
    version: 'Ver 3.3.5a.11',
    date: '12-12',
    content: '调整了奥杜尔[米米尔隆]困难模式的伤害数值，使其更符合当前版本装等。',
    isHot: false
  },
  {
    id: 'u3',
    version: 'Ver 3.3.5a.10',
    date: '12-08',
    content: '更新了商城的坐骑列表，新增[幽灵虎]兑换选项。',
    isHot: false
  },
  {
    id: 'u4',
    version: 'Ver 3.3.5a.09',
    date: '12-05',
    content: '优化了客户端在达拉然的帧数表现。',
    isHot: false
  }
];

export const TOTAL_GAME_SIZE_MB = 15000; // 15GB approx

// --- SHOP DATA ---

export const USER_CHARACTERS: GameCharacter[] = [
  { guid: 1001, name: 'TimeWalker', level: 80, race: 'Human', class: 'Paladin' },
  { guid: 1002, name: 'ShadowStep', level: 72, race: 'Undead', class: 'Rogue' },
  { guid: 1003, name: 'FrostNova', level: 1, race: 'Gnome', class: 'Mage' },
];

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'mount_01',
    name: '迅捷幽灵虎',
    description: '史诗级坐骑。它的半透明身躯闪耀着奥术的光辉。',
    price: 5000,
    category: 'mounts',
    imageUrl: 'https://wow.zamimg.com/uploads/screenshots/normal/66048-swift-spectral-tiger.jpg', // Placeholder logic in component if fails
    isHot: true
  },
  {
    id: 'mount_02',
    name: '无敌的缰绳',
    description: '阿尔萨斯·米奈希尔曾经的坐骑。',
    price: 3500,
    category: 'mounts',
    imageUrl: 'https://wow.zamimg.com/uploads/screenshots/normal/157207-invincibles-reins.jpg',
  },
  {
    id: 'mount_03',
    name: 'X-51 虚空火箭',
    description: '地精工程学的极致，带你飞越外域的虚空。',
    price: 1500,
    category: 'mounts',
    imageUrl: 'https://wow.zamimg.com/uploads/screenshots/normal/66050-x-51-nether-rocket-x-treme.jpg',
  },
  {
    id: 'pet_01',
    name: '也就是泰瑞尔',
    description: '来自另一个世界的正义天使，虽然有点小。',
    price: 800,
    category: 'pets',
    imageUrl: 'https://wow.zamimg.com/uploads/screenshots/normal/82676-tyraels-hilt.jpg',
    isNew: true
  },
  {
    id: 'pet_02',
    name: '灵魂商人',
    description: '当你杀死怪物时，他会收集灵魂并给你一些奇怪的小玩意。',
    price: 1200,
    category: 'pets',
    imageUrl: 'https://wow.zamimg.com/uploads/screenshots/normal/74889-soul-trader-beacon.jpg',
  },
  {
    id: 'svc_01',
    name: '角色改名服务',
    description: '为你的角色更改一个新的名字。',
    price: 500,
    category: 'services',
    imageUrl: 'https://icons.iconarchive.com/icons/wow-icons/wrath-of-the-lich-king/512/Scroll-icon.png',
  },
  {
    id: 'svc_02',
    name: '阵营转换服务',
    description: '背叛你的阵营，加入对立面。包含种族变更。',
    price: 2000,
    category: 'services',
    imageUrl: 'https://icons.iconarchive.com/icons/wow-icons/wrath-of-the-lich-king/512/Helmet-icon.png',
    isHot: true
  },
  {
    id: 'cos_01',
    name: '食人魔玩偶',
    description: '变身成为一个双头食人魔，持续10分钟。',
    price: 300,
    category: 'cosmetics',
    imageUrl: 'https://icons.iconarchive.com/icons/wow-icons/wrath-of-the-lich-king/512/Toy-icon.png',
  }
];
