import { Rocket } from 'lucide-react';

const DevPage = () => (
  <div className="flex flex-col items-center justify-center h-[500px] text-gray-400 animate-in fade-in duration-500">
    <Rocket size={64} className="mb-4 opacity-50" />
    <h2 className="text-2xl font-bold mb-2">开发计划</h2>
    <p>正在开发中... 查看服务器未来的更新路线图。</p>
  </div>
);

export default DevPage;
