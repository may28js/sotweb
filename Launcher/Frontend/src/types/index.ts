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
