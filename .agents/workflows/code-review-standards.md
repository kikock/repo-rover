---
description: repo-rover 代码审查与架构量化约束 (Tauri 2.x + Rust 原生底层 + Fluent Design)
---

# repo-rover 核心量化指标与架构约束规范

## 1. 核心量化代码指标 (Quantitative Code Constraints)

- **单文件长度 (File Length)**：推荐 `<= 300` 行，硬性上限 `<= 500` 行。
  - *特别约束*：针对历史单文件（如 `App.tsx`），严禁继续追加逻辑，新功能必须模块化拆分至独立子组件与 Hook。
- **单函数长度 (Function Length)**：推荐 `<= 30` 行，硬性上限 `<= 50` 行。
- **单文件核心处理函数 (Functions per File)**：`<= 5` 个核心业务/Command 处理函数。
- **圈复杂度 (Cyclomatic Complexity)**：`<= 5`，避免多分支与深层嵌套。
- **Tauri Command 参数**：`<= 3` 个统一封装的 Payload 结构体。

---

## 2. 架构边界与工程底线 (Architecture Boundaries)

### 2.1 Tauri 2.x 与 Rust 原生底层约束
- **并发与扫描隔离**：
  - 磁盘 Git 仓库扫描、大目录深度遍历、批量状态提取必须纯在 Rust 底层并行执行（采用 `rayon` 或 `tokio::spawn`）。
  - 前端 React 层仅作为纯净无状态/展示层，严禁在前端通过 Shell 插件反复进行长耗时管道拼接。
- **安全与错误传播 (Zero Unwrap)**：
  - 严禁在生产代码中使用未处理的 `.unwrap()` 或 `.expect()`。
  - 所有文件 I/O 与 Git 探测必须通过 `Result<T, AppError>` 进行严格的类型传播。
- **事件流控与反压**：
  - Tauri Event 发射频率必须进行节流与防抖（`throttle/debounce >= 50ms`），禁止向前端高频发送细碎事件导致 WebView2 渲染管线卡死。
- **性能基准**：
  - 内存基线：空闲常驻内存 `<= 80MB`，深度扫描峰值内存 `<= 250MB`。

### 2.2 Fluent Design 视觉设计规范（量化指标）
- **圆角体系 (Corner Radius)**：
  - 基础控件（按钮、搜索框、分支标签、筛选 Tag）：`4px`。
  - 卡片容器（仓库卡片、统计指标看板、弹窗）：`8px`。
  - 主窗口容器圆角：`8px`。
- **深度层级 (Elevation)**：
  - 仓库卡片静止态：`0 1px 3px rgba(0,0,0,0.05)`；悬停态（Hover）：`0 4px 12px rgba(0,0,0,0.12)`。
- **亚克力与主题 (Mica/Acrylic)**：
  - 侧边栏与标题栏支持半透明材质模糊效果。
  - 严格支持深色/浅色模式平滑切换，暗色背景推荐 `#202020`，前景色对比度符合 WCAG AA (`>= 4.5:1`)。
- **微动效 (Micro-interactions)**：
  - 列表加载骨架屏过渡、卡片悬浮动效 `<= 200ms`，缓动采用 `cubic-bezier(0.1, 0.9, 0.2, 1.0)`。
