export interface ShopItem {
  id: number;
  gameItemId?: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: 'gem' | 'vote';
  iconUrl: string;
  category: string;
  tags?: string[];
  discount?: number;
  featured?: boolean;
  isUnique?: boolean;
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

export interface Character {
  name: string;
  race: number;
  class: number;
  level: number;
  gender: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  points: number;
  accessLevel: number;
}
