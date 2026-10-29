# repo-rover 项目级开发规范与最高准则 (rules.md)

## 1. 核心架构与技术栈约束
- **主框架**：Tauri 2.x + Rust 原生底层 + React 18 + TypeScript + Fluent Design。
- **工作流与审查规范**：必须强制遵守 [.agents/workflows/code-review-standards.md](file:///.agents/workflows/code-review-standards.md) 中的全部量化指标。

## 2. 核心量化指标红线
1. **代码规模**：单文件行数 `<= 300` 行（硬上限 `<= 500` 行）；单函数 `<= 30` 行（硬上限 `<= 50` 行）。
   - *存量代码治理*：存量大文件禁止追加业务逻辑，必须逐步拆分为子组件（如 `Dashboard`、`RepoCard`、`GitInspector` 等）。
2. **Rust 原生安全准则**：
   - 严禁生产代码裸调 `.unwrap()` / `.expect()`，必须使用 `Result<T, AppError>` 传播。
   - 耗时目录遍历与 Git 扫描必须在 Rust 后端以并行线程池处理。
3. **IPC 与事件节流**：
   - Tauri Event 事件推送必须限制频率（`>= 50ms` 节流），禁止泛洪式推送。
   - Command 参数对象封装 `<= 3` 个字段结构体。
4. **Fluent Design 视觉**：
   - 小控件圆角 `4px`，卡片圆角 `8px`。
   - 交互过渡时长 `<= 200ms`，缓动采用 `cubic-bezier(0.1, 0.9, 0.2, 1.0)`。
   - 文本与背景对比度 `>= 4.5:1`。
