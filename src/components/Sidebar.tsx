import React from "react";
import logoImg from "../assets/logo.png";
import { NavTab } from "../types";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onHideToTray: () => void;
  reposCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onHideToTray,
  reposCount,
}) => {
  return (
    <aside className="sidebar">
      <div className="brand-header">
        <img
          src={logoImg}
          alt="Repo Rover Logo"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 4px 12px var(--accent-glow)",
          }}
        />
        <div>
          <div className="brand-title">Repo Rover</div>
          <div className="brand-subtitle">Git 仓库全盘探针</div>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
        <div
          className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => onTabChange("dashboard")}
        >
          📊 主页工作台
        </div>
        <div
          className={`nav-item ${activeTab === "repos" ? "active" : ""}`}
          onClick={() => onTabChange("repos")}
        >
          📁 本地仓库资产
          {reposCount > 0 && (
            <span style={{ marginLeft: "auto", fontSize: "11px", opacity: 0.8 }}>
              {reposCount}
            </span>
          )}
        </div>
        <div
          className={`nav-item ${activeTab === "git-env" ? "active" : ""}`}
          onClick={() => onTabChange("git-env")}
        >
          ⚙️ Git 环境与配置
        </div>
        <div
          className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => onTabChange("settings")}
        >
          🛡️ 扫描与剪枝规则
        </div>
      </nav>

      {/* 底部缩小到托盘与运行模式提示 */}
      <div
        style={{
          padding: "12px 10px",
          fontSize: "11px",
          color: "var(--text-muted)",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <button
          className="btn btn-secondary"
          style={{ width: "100%", fontSize: "11px", padding: "6px", justifyContent: "center" }}
          onClick={onHideToTray}
          title="缩小至系统托盘常驻（不在任务栏占位）"
        >
          📥 缩小至系统托盘
        </button>
        <div>已就绪资产：{reposCount} 个项目</div>
      </div>
    </aside>
  );
};
