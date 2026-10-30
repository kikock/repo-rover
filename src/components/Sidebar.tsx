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
  onOpenAuthorUrl?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  reposCount,
  themeMode,
  onToggleTheme,
  onOpenRepoUrl,
  onOpenAuthorUrl,
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
          gap: "8px",
          background: "rgba(0, 0, 0, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-success)" }} />
            已就绪资产：<strong style={{ color: "var(--text-main)" }}>{reposCount}</strong>
          </span>
          <button
            onClick={onToggleTheme}
            title={themeMode === "light" ? "切换为深色模式" : "切换为浅色模式"}
            style={{
              padding: "2px 8px",
              fontSize: "11px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-card)",
              color: "var(--text-main)",
              transition: "all 0.15s ease",
            }}
          >
            {themeMode === "light" ? "🌙 深色" : "☀️ 浅色"}
          </button>
        </div>

        {/* 类似 Shields.io 截图2的双拼胶囊徽章组合 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "6px",
            borderTop: "1px dashed var(--border-subtle)",
            fontSize: "11px",
          }}
        >
          {/* 版本与作者胶囊 */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                display: "inline-flex",
                borderRadius: "3px",
                overflow: "hidden",
                fontSize: "10px",
                lineHeight: "16px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
              }}
            >
              <span style={{ background: "#474b55", color: "#e6edf3", padding: "0 4px" }}>v</span>
              <span style={{ background: "#1f6feb", color: "#ffffff", padding: "0 5px", fontWeight: 600 }}>1.0.3</span>
            </span>

            <button
              onClick={onOpenAuthorUrl}
              title="访问作者主页 (https://home.34462958.xyz)"
              style={{
                display: "inline-flex",
                borderRadius: "3px",
                overflow: "hidden",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontSize: "10px",
                lineHeight: "16px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                transition: "transform 0.12s ease, opacity 0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.04)";
                e.currentTarget.style.opacity = "0.95";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.opacity = "1";
              }}
            >
              <span style={{ background: "#474b55", color: "#e6edf3", padding: "0 4px" }}>by</span>
              <span style={{ background: "#238636", color: "#ffffff", padding: "0 5px", fontWeight: 600 }}>kikock</span>
            </button>
          </div>

          {/* 截图2风格 Git 仓库双拼徽章按钮 */}
          <button
            onClick={onOpenRepoUrl}
            title="访问 GitHub 仓库 (https://github.com/kikock/repo-rover)"
            style={{
              display: "inline-flex",
              borderRadius: "3px",
              overflow: "hidden",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: "10px",
              lineHeight: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              transition: "transform 0.12s ease, opacity 0.12s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.04)";
              e.currentTarget.style.opacity = "0.95";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.opacity = "1";
            }}
          >
            <span
              style={{
                background: "#3e4451",
                color: "#ffffff",
                padding: "0 5px",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                fontWeight: 500,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path
                  d="M2.6 10.59L10.59 2.6a2 2 0 0 1 2.83 0l8 8a2 2 0 0 1 0 2.82l-8 8a2 2 0 0 1-2.83 0l-7.99-8a2 2 0 0 1 0-2.83z"
                  fill="#F05032"
                />
                <circle cx="12" cy="12" r="2.2" fill="#fff" />
                <circle cx="12" cy="7" r="1.5" fill="#fff" />
                <circle cx="16" cy="12" r="1.5" fill="#fff" />
                <path d="M12 7v5m0 0h4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span>Git</span>
            </span>
            <span
              style={{
                background: "#0969da",
                color: "#ffffff",
                padding: "0 5px",
                fontWeight: 600,
              }}
            >
              仓库 ↗
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

