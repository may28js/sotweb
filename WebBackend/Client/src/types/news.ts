export interface News {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  type: 'Update' | 'Event' | 'Maintenance' | 'General' | '更新' | '活动' | '维护' | '综合';
  thumbnail?: string;
}