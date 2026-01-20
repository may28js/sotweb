# SOT协议：启动器无感自动登录技术方案

## 1. 概述
本方案旨在为《魔兽世界》3.3.5a 客户端实现“启动器一键登录”功能，同时严格遵守以下约束：
*   **零侵入**：不修改 `WoW.exe` 二进制文件。
*   **零注入**：不使用 DLL 注入或内存读写技术（避免杀软报毒）。
*   **原生兼容**：基于魔兽世界原生 SRP6 认证协议，不破坏原有账号密码登录功能。

## 2. 核心原理：Token 伪装与动态 SRP6
传统的自动登录通常需要客户端配合（如修改 Lua 接口），本方案创新性地采用 **“服务端主动配合”** 策略：
1.  **伪装**：启动器将一次性 Token 填入客户端的“密码框”，并将“用户名”修改为特殊格式（如 `User#Token`）。
2.  **识别**：服务端识别到特殊格式的用户名，进入“Token 登录模式”。
3.  **验证**：服务端不再查数据库校验密码，而是**即时**使用 Token 生成一套临时的 SRP6 验证参数（Salt/Verifier），与客户端进行握手。
4.  **结果**：客户端认为自己用“密码”登录成功了，服务端也验证了 Token 的合法性，双方建立 Session。

## 3. 详细实施流程

### 3.1 阶段一：Web 后端 (Token 发放)
*   **接口**：`POST /api/auth/token`
*   **输入**：启动器 Session Key
*   **逻辑**：
    1.  验证启动器登录态。
    2.  生成随机 Token（32位字符，高熵）。
    3.  存入 Redis/数据库：`Key=Token, Value=AccountId, TTL=30s`。
    4.  返回 Token 给启动器。

### 3.2 阶段二：启动器端 (C#)
*   **文件操作**：
    1.  备份 `WTF/Config.wtf`。
    2.  修改/添加字段：
        *   `SET accountName "玩家真实账号#TOKEN_STRING"`
        *   `SET accountPassword "TOKEN_STRING"`
*   **进程管理**：
    1.  启动 `WoW.exe`。
    2.  **看门狗线程**：监控 WoW 进程。
    3.  **清理逻辑**：一旦检测到 WoW 进程退出（或启动器下次启动时），立即读取 `Config.wtf`，如果发现 `accountName` 包含 `#`，则还原为纯用户名，并清空密码字段。
*   **异常处理**：确保在任何崩溃情况下，Config 文件最终都能被还原，避免用户下次手动登录时困惑。

### 3.3 阶段三：服务端 AuthServer (C++)
*   **修改文件**：`src/server/authserver/Server/AuthSocket.cpp`
*   **修改函数**：`AuthSocket::HandleLogonChallenge`
*   **逻辑伪代码**：
    ```cpp
    // 1. 解析用户名
    std::string user_input = GetParam("I");
    std::string token;
    std::string real_username;
    
    if (ExtractToken(user_input, real_username, token)) {
        // === Token 登录分支 ===
        
        // 2. 验证 Token 有效性 (查库)
        if (!VerifyTokenInDB(token)) {
            SendAuthError(WOW_FAIL_UNKNOWN_ACCOUNT);
            return;
        }
        
        // 3. 标记 Token 已使用 (防重放)
        MarkTokenUsed(token);
        
        // 4. 动态生成 SRP6 参数
        // 关键点：用 Token 当作密码来生成 Salt 和 Verifier
        // 这样客户端用 Token 计算，服务端也用 Token 计算，数学上才能通过
        s = GenerateRandomSalt();
        v = CalculateSRP6Verifier(real_username, token, s);
        
        // 5. 继续后续握手 (B, g, N...)
        _login.s = s;
        _login.v = v;
        // ...发送 Challenge 包
    } else {
        // === 普通登录分支 ===
        // 走原有的数据库查询逻辑
    }
    ```

### 3.4 阶段四：服务端 WorldServer (C++)
*   **修改文件**：`src/server/worldserver/Server/WorldSocket.cpp`
*   **修改函数**：`WorldSocket::HandleAuthSession`
*   **逻辑**：
    *   客户端发来的 `AuthSession` 包里，用户名依然是 `User#Token`。
    *   在查询角色列表之前，必须执行：
        ```cpp
        std::string account = GetStrParam();
        size_t pos = account.find('#');
        if (pos != std::string::npos) {
            account = account.substr(0, pos); // 还原为真实用户名
        }
        // 使用还原后的 account 继续后续流程
        ```

## 4. 安全性分析
1.  **Token 时效性**：Token 有效期仅 30 秒，且一次性使用，即使 Config 文件泄露，Token 也早已失效。
2.  **密码隔离**：真实密码从未传输给客户端，也从未保存在 Config 文件中。
3.  **防注入**：服务端严格校验 Token 格式，防止 SQL 注入。

## 5. 优缺点评价
*   **优点**：
    *   **最稳定**：基于 TCP 协议层，不依赖内存地址，不受客户端版本微调影响。
    *   **最安全**：无木马特征，杀毒软件友好。
    *   **体验好**：真正的“点击即玩”。
*   **缺点**：
    *   需要拥有服务端源码并重新编译。
    *   开发链路较长（涉及 Web、启动器、服务端三端联调）。

## 6. 附录：Config.wtf 示例
**注入状态：**
```lua
SET accountName "MyPlayer#A1B2C3D4E5"
SET accountPassword "A1B2C3D4E5"
```

**还原状态：**
```lua
SET accountName "MyPlayer"
SET accountPassword ""
```
