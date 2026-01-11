import { News } from "../types/news";

export const MOCK_NEWS: News[] = [
    {
      id: 1,
      title: '更新说明：1.2 版本 - 起源',
      content: '我们很高兴宣布我们的第一个重大更新发布！此补丁带来了许多新功能、错误修复和游戏改进。阅读全文了解详情...',
      author: '开发团队',
      createdAt: '2023-10-27T10:00:00Z',
      type: '更新',
      thumbnail: '/demo-assets/news/24.jpeg'
    },
    {
      id: 2,
      title: '社区活动：宏伟竞赛',
      content: '这个周末加入我们的宏伟竞赛！与其他玩家竞争，赢取独家奖励和头衔。报名现在开始！',
      author: '社区经理',
      createdAt: '2023-10-25T14:30:00Z',
      type: '活动',
      thumbnail: '/demo-assets/news/28.jpeg'
    },
    {
      id: 3,
      title: '计划维护 - 10月30日',
      content: '服务器将于UTC时间10月30日凌晨2:00至6:00进行计划维护。对于给您带来的不便，我们深表歉意。',
      author: '服务器管理员',
      createdAt: '2023-10-24T09:00:00Z',
      type: '维护',
      thumbnail: '/demo-assets/news/5.jpeg'
    },
    {
      id: 4,
      title: '开发者日记：未来路线图',
      content: '抢先了解接下来的内容！在这篇开发者日记中，我们讨论了游戏的长期计划，包括新的扩展和功能。',
      author: '首席设计师',
      createdAt: '2023-10-20T16:00:00Z',
      type: '综合',
      thumbnail: '/demo-assets/news/7.jpg'
    },
    {
      id: 5,
      title: '新职业揭晓：奥术师',
      content: '用全新的奥术师职业掌握奥术艺术！在我们最新的深度解析中了解他们独特的能力和游戏风格。',
      author: '开发团队',
      createdAt: '2023-10-15T11:00:00Z',
      type: '更新',
      thumbnail: '/demo-assets/news/6.avif'
    },
    {
      id: 6,
      title: '周末经验加成活动',
      content: '这个周末所有玩家享受50%经验加成，升级更快！不要错过这个达到满级的机会。',
      author: '社区经理',
      createdAt: '2023-10-10T13:00:00Z',
      type: '活动',
      thumbnail: '/demo-assets/news/8.webp'
    },
  ];

  export const getMockThumbnail = (id: number) => {
    return `/demo-assets/news/${(id % 5) === 0 ? '24.jpeg' : (id % 5) === 1 ? '28.jpeg' : (id % 5) === 2 ? '5.jpeg' : (id % 5) === 3 ? '7.jpg' : '8.webp'}`;
  };
