# StoryOfTimeLauncher - WebBackend 项目规划书

## 1. 项目概况 (Project Overview)

**项目名称**：时光之语 (StoryOfTime) - 官方网站
**核心目标**：为魔兽世界 3.3.5a (巫妖王之怒) 私服提供一个功能完善、体验流畅的官方门户网站。支持玩家注册、游戏账户管理、资讯获取、社区互动及增值服务。
**核心定位**：
1.  **玩家门户**: 玩家获取资讯、管理账户、互动的中心。
2.  **数据中台**: 作为**游戏启动器**的动态数据来源 (新闻、公告、状态、更新日志等)。

**当前状态**: Phase 5 (Store System) - In Progress

### 技术栈 (Tech Stack)
- **前端 (Client)**: Next.js 14+ (React), Tailwind CSS v4, TypeScript
- **后端 (Server)**: ASP.NET Core Web API 9.0
- **数据库**: SQLite (Dev), MySQL 8 (Prod)

---

## 2. 功能路线图 (Feature Roadmap)

### Phase 1: 基础架构与身份验证 (已完成)
- [x] **项目初始化**: Next.js + Tailwind CSS 环境搭建。
- [x] **基础 UI**: 首页、导航栏、页脚响应式布局。
- [x] **身份验证**: 用户注册、用户登录 (对接后端 API)。
- [x] **交互优化**: 解决 Next.js 路由与 RSC 请求冲突问题 (目前采用硬刷新方案)。

### Phase 2: 用户中心与游戏账户管理 (Core - 部分完成)
**核心逻辑**: **统一账户体系**。网站账户即游戏账户 (Single Account System)。
- [x] **用户仪表盘 (Dashboard)**: 显示账户概览 (用户名、邮箱、积分、权限)。
- [x] **游戏账户管理**:
    - [x] 修改账户密码。
    - [ ] 账户解封/状态查询。
    - [x] 积分查询 (已集成在 Token 和 Dashboard)。
- [ ] **角色查看 (简易版)**: 列出账户下的角色列表 (名称、等级、种族、职业)。

### Phase 3: 内容管理系统 (CMS) & 启动器数据源 (In Progress)
**目标**: 发布服务器动态，同时服务于网站访客和启动器用户。
- [x] **新闻/公告系统**: 
    - [x] **后端**: News Model, Controller, Database Migration (SQLite).
    - [x] **前端**: 首页展示最新消息 (NewsList 组件, 动态获取).
    - [x] **API 接口**: `GET /api/news` 提供 JSON 数据供启动器抓取展示.
    - [x] **数据填充**: 初始化测试数据.
    - [x] **管理后台**: 管理员发布新闻 UI (`/admin`).
- [ ] **游戏指南**: "如何连接"、"常见问题"、"下载中心" (提供微端/完整客户端下载链接)。
- [ ] **服务器状态**: 实时显示在线人数、服务器运行时间 (Uptime)、阵营比例 (同步提供 API)。

### Phase 4: 社区与互动
- [ ] **投票系统 (Vote)**: 在各大私服列表网站投票，获取积分 (Vote Points)。
- [ ] **英雄榜 (Armory)**:
    - [ ] 角色详细信息 (装备、天赋、成就)。
    - [ ] 公会列表与排名。
    - [ ] PvP 排名 (竞技场/战场)。

### Phase 5: 商店与经济系统 (Store) - In Progress
- [x] **后端架构**: 
    - [x] Product Model (商品模型).
    - [x] Transaction Model (交易记录模型).
    - [x] StoreController (商品列表 API, 购买逻辑 API).
    - [x] Database Migration & Seeding (初始商品数据).
- [ ] **充值系统**: 集成支付网关 (Alipay/WeChat/PayPal)。
- [x] **前端实现**: 商品列表页、购买交互、结果展示。
- [ ] **道具商店**: 使用积分或捐赠点数购买游戏内物品 (装备、坐骑、改名服务、转阵营等)。
- [ ] **发送物品**: 通过 SOAP/Console 实时发送物品到游戏角色邮箱。

### Phase 6: 管理员面板 (Admin Panel)
- [x] **CMS 管理**: 发布/编辑新闻 (同步推送到启动器)。
- [ ] **用户管理**: 封禁/解封账户。
- [ ] **日志查看**: 查看充值、购买、操作日志。

---

## 3. 目录结构规范 (Directory Structure)

```text
WebBackend/
 Client/                 # 前端项目 (Next.js)
    src/
       app/            # 页面路由 (Login, Register, Dashboard...)
       components/     # 通用组件 (Navbar, Footer, NewsList...)
       services/       # API 请求封装 (api.ts, newsService.ts)
       types/          # TypeScript 类型定义 (news.ts)
       context/        # React Context (AuthContext)
 Server/                 # 后端项目 (ASP.NET Core)
     Controllers/        # API 控制器 (AuthController, NewsController)
     Models/             # 数据模型 (User, News)
     Data/               # 数据库上下文 (ApplicationDbContext)
```