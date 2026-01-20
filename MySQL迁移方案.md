# 启动器社区与网站 MySQL 迁移及整合方案

## 1. 现状评估
- **依赖库已就绪**：项目已安装 `Pomelo.EntityFrameworkCore.MySql` (v9.0.0)。
- **代码已预留**：`Program.cs` 中已包含 MySQL 连接配置代码（目前被注释）。
- **架构隔离**：游戏服务器服务 (`AzerothCoreGameServerService`) 逻辑与网站数据库完全解耦，适合独立迁移。

## 2. 迁移方案：SQLite 转 MySQL

### 第一步：准备数据库环境
在游戏服务器 MySQL 实例中，创建一个新的空数据库（推荐命名：`storyoftime_web`），用于存放网站和社区数据。**切勿**直接使用 `acore_auth` 或 `acore_characters` 库。

### 第二步：配置修改
1. **修改 `appsettings.json`**：
   将 `ConnectionStrings` 中的 `DefaultConnection` 修改为 MySQL 格式：
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=127.0.0.1;Database=storyoftime_web;User=root;Password=您的密码;"
   }
   ```

2. **修改 `Program.cs`**：
   注释掉 SQLite 配置，启用 MySQL 配置：
   ```csharp
   // 启用 MySQL
   var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
   builder.Services.AddDbContext<ApplicationDbContext>(options =>
       options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
   ```

### 第三步：重新生成迁移 (Migrations)
由于 SQLite 与 MySQL 数据类型不兼容，必须重新生成迁移文件：
1. 备份 `storyoftime.db`。
2. 删除 `Server/Migrations` 文件夹下的所有文件。
3. 执行命令生成新迁移：
   ```powershell
   dotnet ef migrations add InitialCreate_MySQL
   dotnet ef database update
   ```

### 第四步：数据迁移
使用 Navicat Premium 或 DBeaver 等工具，选择**数据同步 (Data Synchronization)** 模式，将本地 SQLite 数据导入到新的 MySQL 表中。**注意：仅同步数据，不要覆盖由代码生成的表结构。**

## 3. 整合方案

### 数据库架构
- **storyoftime_web**：存放网站用户、新闻、商城、启动器社区（频道、消息、好友）等数据。
- **acore_auth**：魔兽世界账号数据库（只读/有限写）。
- **acore_characters**：魔兽世界角色数据库（只读）。

### 权限与同步
- **登录即同步**：启动器登录时，调用网站 API 获取用户 `AccessLevel`。
- **角色映射**：根据 `AccessLevel` 自动赋予用户在社区中的系统角色（如社区拥有者、版主）。
- **单向信任**：网站数据库为权限源头，启动器本地数据库跟随更新。

## 4. 后续操作建议
- 为网站后端创建一个专用的 MySQL 用户（如 `web_admin`），赋予对 `storyoftime_web` 的完全权限，以及对游戏库的只读权限，提高安全性。
