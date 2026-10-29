import React from "react";
import { NavTab } from "../types";

interface DashboardProps {
  totalCount: number;
  dirtyCount: number;
  unpushedCount: number;
  cleanCount: number;
  onNavigateRepos: () => void;
  onOpenAddModal: () => void;
  onExportMarkdown: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  totalCount,
  dirtyCount,
  unpushedCount,
  cleanCount,
  onNavigateRepos,
  onOpenAddModal,
  onExportMarkdown,
}) => {
  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">已索引仓库总数 (已持久化)</span>
          <span className="stat-value" style={{ color: "var(--accent-primary)" }}>
            {totalCount}
          </span>
          <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
            二次打开秒开，免重复扫描
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">🔴 脏工作区预警 (Dirty)</span>
          <span className="stat-value" style={{ color: "var(--color-dirty)" }}>
            {dirtyCount}
          </span>
          <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
            存在未暂存或未提交代码
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">🟡 未推送 Commit (Unpushed)</span>
          <span className="stat-value" style={{ color: "var(--color-unpushed)" }}>
            {unpushedCount}
          </span>
          <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
            本地领先于远程追踪源
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">🟢 同步纯净状态 (Clean)</span>
          <span className="stat-value" style={{ color: "var(--color-clean)" }}>
            {cleanCount}
          </span>
          <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
            工作区健康且已全部同步
          </span>
        </div>
      </div>

      {/* 快捷引导卡片 */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-md)",
          padding: "24px",
          border: "1px solid var(--border-subtle)",
          marginBottom: "24px",
        }}
      >
        <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>
          欢迎使用 Repo Rover 代码资产治理中心
        </h3>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
          已成功构建本地代码资产数据库。<strong>二次打开无需重新扫描，秒开即用！</strong>
          你可以随时点击右上角「➕ 添加仓库」手动增加项目，或在卡片中直接「移除跟踪」进行资产裁剪。
        </p>
        <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
          <button className="btn-primary" onClick={onNavigateRepos}>
            查看仓库资产看板 ({totalCount})
          </button>
          <button className="btn-secondary" onClick={onOpenAddModal}>
            ➕ 手动添加仓库
          </button>
          <button className="btn-secondary" onClick={onExportMarkdown}>
            导出 Markdown 报告
          </button>
        </div>
      </div>
    </div>
  );
};
