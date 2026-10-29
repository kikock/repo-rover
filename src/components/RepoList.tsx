import React from "react";
import { RepoHealth } from "../services/api";
import { StatusFilter } from "../types";
import { RepoCard } from "./RepoCard";

interface RepoListProps {
  repos: RepoHealth[];
  filteredRepos: RepoHealth[];
  dirtyCount: number;
  unpushedCount: number;
  cleanCount: number;
  statusFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  isBatchMode: boolean;
  onToggleBatchMode: () => void;
  selectedPaths: string[];
  onSelectAllFiltered: () => void;
  onClearSelected: () => void;
  onBatchRemove: () => void;
  hasJunkRepos: boolean;
  junkReposCount: number;
  onSelectAllJunk: () => void;
  onOpenAddModal: () => void;
  onExportMarkdown: () => void;
  onToggleSelectRepo: (path: string) => void;
  onOpenRepoModal: (repo: RepoHealth) => void;
  onOpenTerminal: (path: string) => void;
  onOpenExplorer: (path: string) => void;
  onOpenBrowser: (url: string) => void;
  onRemoveTrack: (path: string, name: string) => void;
}

export const RepoList: React.FC<RepoListProps> = ({
  repos,
  filteredRepos,
  dirtyCount,
  unpushedCount,
  cleanCount,
  statusFilter,
  onFilterChange,
  isBatchMode,
  onToggleBatchMode,
  selectedPaths,
  onSelectAllFiltered,
  onClearSelected,
  onBatchRemove,
  hasJunkRepos,
  junkReposCount,
  onSelectAllJunk,
  onOpenAddModal,
  onExportMarkdown,
  onToggleSelectRepo,
  onOpenRepoModal,
  onOpenTerminal,
  onOpenExplorer,
  onOpenBrowser,
  onRemoveTrack,
}) => {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className={`btn-secondary ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => onFilterChange("all")}
            style={statusFilter === "all" ? { borderColor: "var(--accent-primary)", color: "var(--accent-primary)" } : {}}
          >
            全部 ({repos.length})
          </button>
          <button
            className={`btn-secondary ${statusFilter === "dirty" ? "active" : ""}`}
            onClick={() => onFilterChange("dirty")}
            style={statusFilter === "dirty" ? { borderColor: "var(--color-dirty)", color: "var(--color-dirty)" } : {}}
          >
            🔴 脏工作区 ({dirtyCount})
          </button>
          <button
            className={`btn-secondary ${statusFilter === "unpushed" ? "active" : ""}`}
            onClick={() => onFilterChange("unpushed")}
            style={statusFilter === "unpushed" ? { borderColor: "var(--color-unpushed)", color: "var(--color-unpushed)" } : {}}
          >
            🟡 未推送 ({unpushedCount})
          </button>
          <button
            className={`btn-secondary ${statusFilter === "clean" ? "active" : ""}`}
            onClick={() => onFilterChange("clean")}
            style={statusFilter === "clean" ? { borderColor: "var(--color-clean)", color: "var(--color-clean)" } : {}}
          >
            🟢 纯净就绪 ({cleanCount})
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {hasJunkRepos && (
            <button
              className="smart-clean-chip"
              onClick={onSelectAllJunk}
              title="一键识别并勾选所有由 IDE/Agent 生成的无用历史缓存仓库"
            >
              🧹 勾选临时缓存 ({junkReposCount})
            </button>
          )}
          <button
            className={`btn-secondary ${isBatchMode ? "active" : ""}`}
            onClick={onToggleBatchMode}
            style={isBatchMode ? { borderColor: "var(--accent-primary)", color: "var(--accent-primary)", background: "var(--accent-glow)" } : {}}
            title="开启多选批量管理模式"
          >
            ☑️ 批量管理 {selectedPaths.length > 0 ? `(${selectedPaths.length})` : ""}
          </button>
          <button className="btn-secondary" onClick={onOpenAddModal}>
            ➕ 添加仓库
          </button>
          <button className="btn-secondary" onClick={onExportMarkdown}>
            📥 导出清单 (Markdown)
          </button>
        </div>
      </div>

      {/* 📦 批量选择与批量删除快捷操作工具栏 */}
      {(isBatchMode || selectedPaths.length > 0) && (
        <div className="batch-actions-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)" }}>
              📦 已选 <strong style={{ color: "var(--accent-primary)" }}>{selectedPaths.length}</strong> / {filteredRepos.length} 个项目
            </span>
            <button
              className="btn-secondary"
              style={{ padding: "3px 10px", fontSize: "11px" }}
              onClick={onSelectAllFiltered}
            >
              全选当前筛选 ({filteredRepos.length})
            </button>
            <button
              className="btn-secondary"
              style={{ padding: "3px 10px", fontSize: "11px" }}
              onClick={onClearSelected}
            >
              清空勾选
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              className="btn-primary"
              style={{
                background: "#d83b01",
                borderColor: "#d83b01",
                padding: "5px 14px",
                fontSize: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
              disabled={selectedPaths.length === 0}
              onClick={onBatchRemove}
            >
              🗑️ 批量移除跟踪 ({selectedPaths.length} 项)
            </button>
            <button
              className="btn-secondary"
              style={{ padding: "5px 10px", fontSize: "12px" }}
              onClick={onToggleBatchMode}
            >
              退出批量
            </button>
          </div>
        </div>
      )}

      {filteredRepos.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "var(--text-muted)",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔍</div>
          <div style={{ fontSize: "15px", fontWeight: "500" }}>暂未发现符合条件的 Git 仓库</div>
          <div style={{ fontSize: "12.5px", marginTop: "6px" }}>请点击顶栏「启动全盘探针扫描」或「➕ 添加仓库」</div>
        </div>
      ) : (
        <div className="repo-card-grid">
          {filteredRepos.map((repo) => (
            <RepoCard
              key={repo.path}
              repo={repo}
              isSelected={selectedPaths.includes(repo.path)}
              isBatchMode={isBatchMode}
              onToggleSelect={onToggleSelectRepo}
              onOpenModal={onOpenRepoModal}
              onOpenTerminal={onOpenTerminal}
              onOpenExplorer={onOpenExplorer}
              onOpenBrowser={onOpenBrowser}
              onRemoveTrack={onRemoveTrack}
            />
          ))}
        </div>
      )}
    </div>
  );
};
