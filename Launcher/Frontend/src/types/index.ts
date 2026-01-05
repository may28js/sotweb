export interface ShopItem {
  id: string;
  title: string;
  desc: string;
  price: number;
  originalPrice?: number;
  currency: 'gem' | 'vote';
  image: string;
  tags: string[];
  discount?: number;
  featured?: boolean;
}

export interface NewsItem {
  id: string;
  tag: string;
  title: string;
  desc: string;
  image: string;
  date: string;
  url?: string;
}

export interface PatchNoteItem {
  version: string;
  date: string;
  content: string;
  highlight?: boolean;
}

export interface ServerStatus {
  status: string;
  onlinePlayers: number;
  maxPlayers: number;
  uptime: string;
}

export interface LauncherConfig {
  realmlist: string;
  websiteUrl: string;
  registerUrl: string;
  latestVersion: string;
  downloadUrl: string;
}
