import { News } from "../types/news";

export const MOCK_NEWS: News[] = [
    {
      id: 1,
      title: 'Patch Notes: Update 1.2 - The Beginning',
      content: 'We are excited to announce the release of our first major update! This patch brings a host of new features, bug fixes, and improvements to the game. Read on for the full details...',
      author: 'DevTeam',
      createdAt: '2023-10-27T10:00:00Z',
      type: 'Update',
      thumbnail: '/demo-assets/news/24.jpeg'
    },
    {
      id: 2,
      title: 'Community Event: The Great Race',
      content: 'Join us this weekend for The Great Race! Compete against other players for a chance to win exclusive rewards and titles. Registration starts now!',
      author: 'CommunityManager',
      createdAt: '2023-10-25T14:30:00Z',
      type: 'Event',
      thumbnail: '/demo-assets/news/28.jpeg'
    },
    {
      id: 3,
      title: 'Scheduled Maintenance - Oct 30',
      content: 'Servers will be down for scheduled maintenance on October 30th from 2:00 AM to 6:00 AM UTC. We apologize for any inconvenience.',
      author: 'ServerAdmin',
      createdAt: '2023-10-24T09:00:00Z',
      type: 'Maintenance',
      thumbnail: '/demo-assets/news/5.jpeg'
    },
    {
      id: 4,
      title: 'Developer Diary: Future Roadmap',
      content: 'Get a sneak peek at what is coming next! In this developer diary, we discuss our long-term plans for the game, including new expansions and features.',
      author: 'LeadDesigner',
      createdAt: '2023-10-20T16:00:00Z',
      type: 'General',
      thumbnail: '/demo-assets/news/7.jpg'
    },
    {
      id: 5,
      title: 'New Class Revealed: The Arcanist',
      content: 'Master the arcane arts with the all-new Arcanist class! Learn about their unique abilities and playstyle in our latest deep dive.',
      author: 'DevTeam',
      createdAt: '2023-10-15T11:00:00Z',
      type: 'Update',
      thumbnail: '/demo-assets/news/6.avif'
    },
    {
      id: 6,
      title: 'Weekend XP Bonus Event',
      content: 'Level up faster this weekend with a 50% XP boost for all players! Don\'t miss out on this opportunity to reach max level.',
      author: 'CommunityManager',
      createdAt: '2023-10-10T13:00:00Z',
      type: 'Event',
      thumbnail: '/demo-assets/news/8.webp'
    },
  ];

  export const getMockThumbnail = (id: number) => {
    return `/demo-assets/news/${(id % 5) === 0 ? '24.jpeg' : (id % 5) === 1 ? '28.jpeg' : (id % 5) === 2 ? '5.jpeg' : (id % 5) === 3 ? '7.jpg' : '8.webp'}`;
  };