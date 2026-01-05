'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Newspaper, 
  ShoppingBag, 
  Users, 
  Settings, 
  LogOut,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['/admin/store']);

  const toggleMenu = (href: string) => {
    setExpandedMenus(prev => 
      prev.includes(href) 
        ? prev.filter(p => p !== href) 
        : [...prev, href]
    );
  };

  // Protect Admin Route
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.accessLevel < 1) { // Assuming 1+ is staff
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div className="h-screen flex items-center justify-center text-yellow-500">加载中...</div>;

  const menuItems = [
    { name: '仪表盘', icon: LayoutDashboard, href: '/admin' },
    { name: '新闻管理', icon: Newspaper, href: '/admin/news' },
    { 
      name: '商店管理', 
      icon: ShoppingBag, 
      href: '/admin/store',
      children: [
        { name: '在售商品', href: '/admin/store/items' },
        { name: '销售记录', href: '/admin/store/sales' }
      ]
    },
    { name: '用户管理', icon: Users, href: '/admin/users' },
    { name: '游戏设置', icon: Gamepad2, href: '/admin/settings/game' },
  ];

  return (
    <div className="flex h-full w-full bg-[#111] text-gray-100 font-sans">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-40'} flex-shrink-0 bg-[#1a1a1a] border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out relative group`}>
        {/* Toggle Button */}
        <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-8 bg-yellow-500 text-black rounded-full p-0.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50"
            title={isCollapsed ? "展开侧边栏" : "折叠侧边栏"}
        >
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>

        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} border-b border-white/10 overflow-hidden whitespace-nowrap`}>
          {isCollapsed ? (
             <span className="text-xl font-bold text-yellow-500 font-serif">S</span>
          ) : (
             <h1 className="text-lg font-bold text-yellow-500 tracking-wider font-serif truncate">时光故事</h1>
          )}
        </div>

        <nav className="flex-1 py-6 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || item.children?.some(c => c.href === pathname);
            const isExpanded = expandedMenus.includes(item.href);
            const hasChildren = item.children && item.children.length > 0;

            return (
              <div key={item.href}>
                {hasChildren ? (
                  <button
                    onClick={() => {
                      if (isCollapsed) {
                        setIsCollapsed(false);
                        if (!isExpanded) toggleMenu(item.href);
                      } else {
                        toggleMenu(item.href);
                      }
                    }}
                    title={isCollapsed ? item.name : ''}
                    className={`w-full flex items-center justify-between ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-yellow-500' // Parent active style (just text color)
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
                      <Icon className={`size-5 ${isCollapsed ? '' : 'mr-3 shrink-0'}`} />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown 
                        className={`size-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                      />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    title={isCollapsed ? item.name : ''}
                    className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className={`size-5 ${isCollapsed ? '' : 'mr-3 shrink-0'}`} />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                )}

                {/* Submenu */}
                {hasChildren && !isCollapsed && isExpanded && (
                  <div className="ml-9 mt-1 space-y-1">
                    {item.children!.map((child) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                            isChildActive
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className={`p-4 border-t border-white/10 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center mb-4' : 'gap-3 mb-4 px-2'}`}>
            <div className="size-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 font-bold shrink-0">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            {!isCollapsed && (
                <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                <p className="text-xs text-gray-500 truncate">管理员</p>
                </div>
            )}
          </div>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            title={isCollapsed ? "退出登录" : ""}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors`}
          >
            <LogOut className={`size-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && "退出登录"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/10 bg-[#1a1a1a]">
          <h2 className="text-lg font-medium text-white">
            {(() => {
                const activeItem = menuItems.find(i => i.href === pathname || i.children?.some(c => c.href === pathname));
                if (activeItem?.children) {
                    const child = activeItem.children.find(c => c.href === pathname);
                    return child ? `${activeItem.name} - ${child.name}` : activeItem.name;
                }
                return activeItem?.name || '后台控制台';
            })()}
          </h2>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-yellow-500 transition-colors">
              返回前台
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-[#111]">
          {children}
        </main>
      </div>
    </div>
  );
}
