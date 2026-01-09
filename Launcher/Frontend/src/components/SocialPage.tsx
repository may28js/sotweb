import { Users } from 'lucide-react';

const SocialPage = () => (
  <div className="flex flex-col items-center justify-center h-[500px] text-gray-400 animate-in fade-in duration-500">
    <Users size={64} className="mb-4 opacity-50" />
    <h2 className="text-2xl font-bold mb-2">社交中心</h2>
    <p>正在开发中... 这里将显示好友列表和公会聊天。</p>
  </div>
);

export default SocialPage;
