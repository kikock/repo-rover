import React from "react";
import { RepoHealth } from "../services/api";

interface RepoCardProps {
  repo: RepoHealth;
  isSelected: boolean;
  isBatchMode: boolean;
  onToggleSelect: (path: string) => void;
  onOpenModal: (repo: RepoHealth) => void;
  onOpenTerminal: (path: string) => void;
  onOpenExplorer: (path: string) => void;
  onOpenBrowser: (url: string) => void;
  onRemoveTrack: (path: string, name: string) => void;
}

export const RepoCard: React.FC<RepoCardProps> = ({
  repo,
  isSelected,
  isBatchMode,
  onToggleSelect,
  onOpenModal,
  onOpenTerminal,
  onOpenExplorer,
  onOpenBrowser,
  onRemoveTrack,
}) => {
  const dirtyTotal = repo.unstaged_count + repo.staged_count + repo.untracked_count;

  return (
    <div
      className={`repo-card ${isSelected ? "batch-selected" : ""}`}
      style={{ cursor: "pointer", position: "relative" }}
      onClick={() => {
        if (isBatchMode) {
          onToggleSelect(repo.path);
        } else {
          onOpenModal(repo);
        }
      }}
      title={isBatchMode ? "点击切换选中状态" : "点击展开该项目的 Git 运维与变更详情控制台"}
    >
      <div>
        <div className="repo-header">
          <div className="repo-name" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              className="batch-card-checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(repo.path)}
              onClick={(e) => e.stopPropagation()}
              title="勾选/取消勾选以批量管理"
            />
            <span>📦</span>
            <span style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {repo.name}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {repo.is_dirty ? (
              <span className="status-badge dirty">🔴 脏改动 ({dirtyTotal})</span>
            ) : repo.ahead_count > 0 ? (
              <span className="status-badge unpushed">🟡 领先 {repo.ahead_count} 提交</span>
            ) : (
              <span className="status-badge clean">🟢 干净</span>
            )}
          </div>
        </div>

        <div className="repo-path" title={repo.path}>
          {repo.path}
        </div>
      </div>

      <div className="repo-meta">
        <div className="repo-meta-row">
          <span>当前主分支：</span>
          <strong style={{ color: "var(--accent-primary)" }}>🌿 {repo.branch}</strong>
        </div>
        <div className="repo-meta-row">
          <span>托管平台：</span>
          <span>{repo.remote_provider || "纯本地孤岛仓库"}</span>
        </div>
        {repo.last_commit_time && (
          <div className="repo-meta-row">
            <span>最后提交：</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{repo.last_commit_time}</span>
          </div>
        )}
        {repo.last_commit_msg && (
          <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            💬 {repo.last_commit_msg}
          </div>
        )}
      </div>

      {/* 交互操作栏 */}
      <div className="repo-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="btn-icon-action"
          onClick={() => onOpenTerminal(repo.path)}
          title="在当前目录启动终端"
        >
          📟 终端
        </button>
        <button
          className="btn-icon-action"
          onClick={() => onOpenExplorer(repo.path)}
          title="在文件资源管理器中打开"
        >
          📂 目录
        </button>
        {repo.remote_url && (
          <button
            className="btn-icon-action"
            onClick={() => onOpenBrowser(repo.remote_url!)}
            title="在浏览器中打开远程主页"
          >
            🌐 远程
          </button>
        )}
        <button
          className="btn-icon-action"
          onClick={() => onRemoveTrack(repo.path, repo.name)}
          title="从资产列表中移除跟踪（保留本地磁盘文件）"
          style={{ color: "var(--text-muted)" }}
        >
          ❌ 移除
        </button>
        <button
          className="btn-icon-action"
          style={{ marginLeft: "auto", background: "var(--accent-glow)", color: "var(--accent-primary)", borderColor: "var(--accent-primary)" }}
          onClick={() => onOpenModal(repo)}
          title="进入 Git 专属运维面板"
        >
          ⚙️ Git 操作
        </button>
      </div>
    </div>
  );
};
