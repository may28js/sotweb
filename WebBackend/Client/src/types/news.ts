export interface News {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  type: 'Update' | 'Event' | 'Maintenance' | 'General';
  thumbnail?: string;
}