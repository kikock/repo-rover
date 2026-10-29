import React from "react";
import logoImg from "../assets/logo.png";
import { NavTab } from "../types";
import { ThemeMode } from "../services/theme";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  reposCount: number;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onOpenRepoUrl: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  reposCount,
  themeMode,
  onToggleTheme,
  onOpenRepoUrl,
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

      {/* 底部运行资产、深浅主题切换与开源信息 */}
      <div
        style={{
          padding: "12px 10px",
          fontSize: "11px",
          color: "var(--text-muted)",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>
            已就绪资产：<strong style={{ color: "var(--text-main)" }}>{reposCount}</strong>
          </span>
          <button
            className="btn btn-secondary"
            onClick={onToggleTheme}
            title={themeMode === "dark" ? "切换为浅色主题" : "切换为深色主题"}
            style={{
              padding: "3px 8px",
              fontSize: "11px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
            }}
          >
            {themeMode === "light" ? "🌙 深色" : "☀️ 浅色"}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "6px",
            borderTop: "1px dashed var(--border-subtle)",
            fontSize: "10px",
            color: "var(--text-muted)",
          }}
        >
          <span>v1.0.2</span>
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span>by</span>
            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>kikock</span>
          </div>
          <button
            onClick={onOpenRepoUrl}
            title="在浏览器中访问 GitHub 仓库 (https://github.com/kikock/repo-rover)"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "var(--accent-primary)",
              fontSize: "10px",
              textDecoration: "underline",
            }}
          >
            Git 仓库 ↗
          </button>
        </div>
      </div>
    </aside>
  );
};

