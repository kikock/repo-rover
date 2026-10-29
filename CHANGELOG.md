# 更新日志 (CHANGELOG)

本文档记录 **Repo Rover** 的所有版本迭代、特性演进与更新历史。
本项目的版本号严格遵循 [语义化版本规范 (SemVer)](https://semver.org/lang/zh-CN/)。

---

## [v1.1.0] - 2026-10-29

### 🚀 新增特性 (Features)
- **Git SSH 密钥与多身份治理中心（板块五）**：
  - **SSH-01 密钥全景探查与指纹识别**：深度扫描 `~/.ssh/` 目录，自动匹配公私钥对，智能解析 Ed25519、RSA 2048/4096、ECDSA 等加密算法，精准提取 SHA256 密钥指纹与注释（邮箱/设备名）；
  - **SSH-02 可视化向导式密钥生成器**：图形化界面引导生成新密钥对，默认推荐现代高强度 `Ed25519` 算法，支持密码短语（Passphrase）保护与自定义文件名；
  - **SSH-03 远程托管平台连通性一键体检**：内置针对 GitHub、GitLab、Gitee、阿里云 Codeup 的 SSH 握手测试探针，采用严格非交互模式（`-o BatchMode=yes`）秒级返回鉴权状态与欢迎消息；
  - **SSH-04 密钥安全生命周期操作**：一键校验并复制公钥文本到系统剪贴板，支持在 Windows 文件资源管理器中高亮定位 `.ssh` 目录；
  - **安全误删回滚机制**：删除密钥时要求输入名称二次确认，且系统自动向 `~/.ssh/.rover_backup/` 创建带时间戳的恢复备份副本。
- **文档体系全面升级**：
  - 更新 [01_需求规格说明书 (SRS)](docs/01_需求规格说明书.md) 至 v1.1，新增 SSH 板块详细需求矩阵、可靠性防死锁 NFR 及验收准则；
  - 归档整理 [方案设计与架构规范.md](docs/方案设计与架构规范.md) 至 `docs/` 目录。

### 🛡️ 架构与安全 (Security & Fixes)
- **私钥绝对只读保护**：后端 Rust 严禁向前端传输或返回私钥明文内容，杜绝内存与视图泄露风险；
- **非交互执行防死锁**：所有外部调用强制注入 `-o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5` 与硬超时中断机制，彻底杜绝控制台等待导致的进程死锁。

---

## [v1.0.0] - 2026-10-29

### 🚀 初始版本发布 (Initial Release)
- **Tauri 2.x + Rust 2021 + Fluent Design 原生架构**：
  - 极轻量占用，闲置内存 < 120MB，秒级启动响应；
  - 完美契合 Windows 11 Fluent UI 质感，深浅色自适应。
- **Git 运行环境与全局配置中心 (ENV)**：
  - 实时探查 `git.exe` 路径、版本号及全局环境变量；
  - 可视化读取并更新 `user.name`、`user.email`；
  - Windows 跨平台换行符治理（`core.autocrlf`）与默认主分支名配置。
- **本地仓库多线程剪枝全盘扫描与健康体检 (SCAN & INSPECT)**：
  - 毫秒级判定仓库四态健康度：🔴 Dirty（未暂存/未提交）、🟡 Unpushed（未推送）、🔵 Behind（落后远程）、🟢 Clean（干净同步）；
  - 内置工业级剪枝黑名单（`node_modules`、`target`、`dist`、`.cargo` 等），扫描百仓库无需等待；
  - 基于 Tauri Event 流式通道实现边扫描边渲染。
- **资产调度与外部协同工作台 (ACTION)**：
  - 智能探测并一键唤起已安装的 VS Code、Cursor、Windsurf 编辑器；
  - 一键在仓库目录启动 Windows Terminal / PowerShell，或在文件资源管理器中定位；
  - 一键在浏览器中直达 GitHub / GitLab 远程主页；
  - 支持单文件改动丢弃、.gitignore 可视化查看与深度忽略清除缓存 (`git rm --cached`)；
  - 支持全盘资产报表一键导出为 Markdown、CSV 或 JSON 文件。
