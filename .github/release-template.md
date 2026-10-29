# 🚀 Repo Rover v__VERSION__ 正式发布

> **Repo Rover** 是一款专为 Windows 10/11 平台打造的本地 Git 仓库全盘探针与资产治理中心。基于 **Tauri 2.x + Rust 原生底层 + Fluent Design** 架构，提供极速全盘索引、四态健康体检、Git 全局环境配置与 SSH 密钥全生命周期治理。

---

### ✨ 核心功能亮点

- 🎨 **Windows 11 Fluent 视觉美学**：深度契合微软 Fluent Design 设计语言，支持 Mica（云母）/ 亚克力半透明光效，深浅色自适应，沉浸式标题栏。
- ⚡ **Rust 高性能多线程并发剪枝索引**：利用工作窃取与智能黑名单（`node_modules`、`target`、`dist`、`.cargo` 等）深度阻断，毫秒级流式扫描全盘仓库。
- 🩺 **仓库健康度四态毫秒级体检**：实时判定工作区 **Dirty（未提交改动）**、**Unpushed（未推送 Commit）**、**Behind（落后远程）**、**Clean（干净同步）**，一目了然预防代码资产丢失。
- 🔑 **Git SSH 密钥与多身份治理中心**：
  - 全景扫描 `~/.ssh/` 自动匹配公私钥对，识别 Ed25519 / RSA / ECDSA 算法与 SHA256 指纹；
  - 提供向导式安全生成器，一键生成现代 Ed25519 密钥；
  - 内置 GitHub、GitLab、Gitee 非交互式握手连通性体检探针；
  - 密钥误删保护与自动本地时间戳回滚备份。
- 🛠️ **资产调度与轻量文件治理**：
  - 一键唤起 VS Code、Cursor、Windsurf 编辑器或在仓库目录打开 Windows Terminal / 资源管理器；
  - 支持单文件改动丢弃、.gitignore 可视化维护与深度忽略清除缓存 (`git rm --cached`)；
  - 支持全盘资产报表一键导出为 Markdown、CSV 或 JSON 文件。

---

### 📥 资产安装指南

| 安装程序 / 格式 | 适用系统 | 架构 | 体积 | 适用场景 | 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`repo-rover-setup-__VERSION__-full-offline-x64.exe`** | Windows 10 / 11 | `x64` | **~150 MB** | **内网隔离机 / 纯离线环境 / 无 WebView2 系统** | **含 WebView2 离线完整版**（内置微软官方离线安装包，无网络或无 WebView2 环境 100% 自动静默安装可用） |
| **`repo-rover-setup-__VERSION__-x64.exe`** | Windows 10 / 11 | `x64` | **~4 MB** | **日常标准联网电脑（推荐大多数用户首选）** | **官方标准安装包**（向导式安装，体积轻巧，带桌面/开始菜单快捷方式与卸载程序） |
| **`repo-rover-portable-__VERSION__-x64.exe`** | Windows 10 / 11 | `x64` | **~4 MB** | **U 盘随身携带 / 即插即用 / 临时检修调试** | **单文件免安装便携版**（双击即用，不写注册表，U 盘即插即用） |
| **`repo-rover-__VERSION__-win-x64.zip`** | Windows 10 / 11 | `x64` | **~2 MB** | **自动化脚本分发 / 自定义工具目录 / CI 归档** | **绿色免安装压缩包**（解压到任意目录直接运行） |

#### 💡 资产选型指南与快速上手：
1. **纯离线机 / 内网隔离环境**：首选 **`repo-rover-setup-__VERSION__-full-offline-x64.exe`**，已内置微软官方离线安装包，无网络或无 WebView2 环境 100% 自动静默安装可用；
2. **常规联网电脑**：推荐下载 **`repo-rover-setup-__VERSION__-x64.exe`**，仅 ~4MB 极致轻盈，运行向导即可一键完成安装；
3. **免安装与便携运行**：可直接下载 **`repo-rover-portable-__VERSION__-x64.exe`** 单文件版，或下载 **`.zip`** 压缩包解压后直接双击运行！

---

### 🔗 相关链接
- 📖 **项目主页**：[kikock/repo-rover](https://github.com/kikock/repo-rover)
- 🐛 **问题反馈**：[提交 Issue](https://github.com/kikock/repo-rover/issues)
- 📝 **更新日志**：[CHANGELOG.md](https://github.com/kikock/repo-rover/blob/master/CHANGELOG.md)
