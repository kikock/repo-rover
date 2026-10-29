import React, { useState } from "react";
import { RepoHealth, RepoDetailInfo } from "../services/api";
import { GitignoreDrawer } from "./GitignoreDrawer";

interface GitInspectorModalProps {
  repo: RepoHealth | null;
  repoDetails: RepoDetailInfo | null;
  loadingDetails: boolean;
  gitActionRunning: boolean;
  consoleLog: string | null;
  isGitignoreOpen: boolean;
  gitignoreContent: string;
  loadingGitignore: boolean;
  savingGitignore: boolean;
  onClose: () => void;
  onRefreshRepo: (repoPath: string) => void;
  onRunGitAction: (action: string, actionName: string) => void;
  onOpenTerminal: (path: string) => void;
  onOpenExplorer: (path: string) => void;
  onOpenBrowser: (url: string) => void;
  onRemoveTrack: (path: string, name: string) => void;
  onDeletePhysicalConfirm: (path: string, name: string) => void;
  onDiscardWorkingTreeConfirm: () => void;
  onSaveRemoteUrl: (newUrl: string) => Promise<void>;
  onToggleGitignore: () => void;
  onGitignoreContentChange: (val: string) => void;
  onSaveGitignore: () => void;
  onQuickAddGitignore: (rule: string) => void;
  onDeepIgnore: (filePath: string, isTracked: boolean) => void;
  onDiscardSingleFile: (filePath: string) => void;
}

export const GitInspectorModal: React.FC<GitInspectorModalProps> = ({
  repo,
  repoDetails,
  loadingDetails,
  gitActionRunning,
  consoleLog,
  isGitignoreOpen,
  gitignoreContent,
  loadingGitignore,
  savingGitignore,
  onClose,
  onRefreshRepo,
  onRunGitAction,
  onOpenTerminal,
  onOpenExplorer,
  onOpenBrowser,
  onRemoveTrack,
  onDeletePhysicalConfirm,
  onDiscardWorkingTreeConfirm,
  onSaveRemoteUrl,
  onToggleGitignore,
  onGitignoreContentChange,
  onSaveGitignore,
  onQuickAddGitignore,
  onDeepIgnore,
  onDiscardSingleFile,
}) => {
  const [isEditingRemote, setIsEditingRemote] = useState(false);
  const [remoteEditVal, setRemoteEditVal] = useState("");
  const [isSavingRemote, setIsSavingRemote] = useState(false);

  if (!repo) return null;

  const validChangedFiles =
    repoDetails?.changed_files.filter(
      (f) => !f.file_path.endsWith(".gitignore") && !f.file_path.endsWith(".gitattributes")
    ) || [];

  const handleSaveRemote = async () => {
    if (!remoteEditVal.trim()) return;
    setIsSavingRemote(true);
    try {
      await onSaveRemoteUrl(remoteEditVal.trim());
      setIsEditingRemote(false);
    } finally {
      setIsSavingRemote(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* 弹窗顶栏 */}
        <div className="modal-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>📦</span>
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>{repo.name}</h2>
              <div>
                {repo.is_dirty ? (
                  <span className="status-badge dirty">
                    🔴 脏工作区 ({repo.unstaged_count + repo.staged_count + repo.untracked_count} 个变动)
                  </span>
                ) : repo.ahead_count > 0 ? (
                  <span className="status-badge unpushed">🟡 未推送 ({repo.ahead_count} 提交)</span>
                ) : (
                  <span className="status-badge clean">🟢 同步纯净</span>
                )}
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: "6px" }}>
              {repo.path}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", fontSize: "11.5px" }}>
              <span style={{ color: "var(--text-secondary)" }}>远程拉取源 (origin):</span>
              <code style={{ color: "var(--accent-primary)", background: "rgba(0,120,212,0.1)", padding: "1px 6px", borderRadius: "3px" }}>
                {repo.remote_url || repoDetails?.remote_url || "未配置远程地址"}
              </code>
              <button
                className="btn-secondary"
                style={{ padding: "2px 8px", fontSize: "11px" }}
                onClick={() => {
                  setRemoteEditVal(repo.remote_url || repoDetails?.remote_url || "");
                  setIsEditingRemote(!isEditingRemote);
                }}
              >
                🔗 配置拉取地址
              </button>
            </div>
            {isEditingRemote && (
              <div style={{ marginTop: "8px", display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  type="text"
                  className="search-box"
                  style={{ fontSize: "12px", padding: "4px 8px", width: "360px", fontFamily: "var(--font-mono)" }}
                  placeholder="例如: https://github.com/username/project.git"
                  value={remoteEditVal}
                  onChange={(e) => setRemoteEditVal(e.target.value)}
                />
                <button
                  className="btn-primary"
                  style={{ padding: "4px 10px", fontSize: "12px" }}
                  disabled={isSavingRemote}
                  onClick={handleSaveRemote}
                >
                  {isSavingRemote ? "保存中..." : "保存"}
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: "4px 8px", fontSize: "12px" }}
                  onClick={() => setIsEditingRemote(false)}
                >
                  取消
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              className="btn-secondary"
              style={{ padding: "4px 10px", fontSize: "11.5px", color: "var(--color-dirty)" }}
              onClick={() => onRemoveTrack(repo.path, repo.name)}
              title="仅从当前资产列表中移除跟踪（安全保留物理文件）"
            >
              ❌ 移除跟踪
            </button>
            <button
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: "20px",
                cursor: "pointer",
                padding: "4px 8px",
              }}
              onClick={onClose}
              title="关闭"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 弹窗内容区 */}
        <div className="modal-body">
          {/* Git 核心动作工具栏 */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "var(--text-secondary)" }}>
              ⚡ Git 常用操作面板
            </div>
            <div className="git-action-toolbar">
              <button
                className="btn-git-action"
                disabled={gitActionRunning}
                onClick={() => onRunGitAction("pull", "Pull 拉取最新代码")}
              >
                ⬇️ Git Pull (拉取)
              </button>
              <button
                className="btn-git-action"
                disabled={gitActionRunning}
                onClick={() => onRunGitAction("push", "Push 推送本地提交")}
              >
                ⬆️ Git Push (推送)
              </button>
              <button
                className="btn-git-action"
                disabled={gitActionRunning}
                onClick={() => onRunGitAction("fetch", "Fetch 同步远程索引")}
              >
                🔄 Git Fetch (同步)
              </button>
              <button
                className="btn-git-action"
                disabled={gitActionRunning}
                onClick={() => onRunGitAction("stash", "一键暂存工作现场")}
              >
                📦 Stash (暂存现场)
              </button>
              <button
                className="btn-git-action"
                disabled={gitActionRunning}
                onClick={() => onRunGitAction("stash_pop", "恢复上次暂存现场")}
              >
                📥 Stash Pop (恢复现场)
              </button>
              <button
                className="btn-git-action"
                disabled={gitActionRunning}
                onClick={onDiscardWorkingTreeConfirm}
                style={{ color: "#ff6e4a" }}
              >
                🗑️ 放弃工作区修改
              </button>

              <div style={{ height: "24px", width: "1px", background: "var(--border-subtle)", margin: "0 4px" }} />

              <button className="btn-git-action" onClick={() => onOpenTerminal(repo.path)}>
                📟 打开终端
              </button>
              <button className="btn-git-action" onClick={() => onOpenExplorer(repo.path)}>
                📂 打开文件夹
              </button>
              {repo.remote_url && (
                <button className="btn-git-action" onClick={() => onOpenBrowser(repo.remote_url!)}>
                  🌐 远程主页
                </button>
              )}
            </div>
          </div>

          {/* 控制台实时执行日志 */}
          {consoleLog && (
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                📟 操作执行日志回显：
              </div>
              <pre className="console-output-box">{consoleLog}</pre>
            </div>
          )}

          {/* 变动文件清单与 .gitignore 深度协同管理 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
                  📑 工作区修改文件清单 ({validChangedFiles.length})
                </span>
                <button
                  className="btn-secondary"
                  style={{
                    padding: "2px 8px",
                    fontSize: "11px",
                    borderColor: isGitignoreOpen ? "var(--accent-primary)" : "var(--border-subtle)",
                    color: isGitignoreOpen ? "var(--accent-primary)" : "var(--text-secondary)",
                    background: isGitignoreOpen ? "var(--accent-glow)" : "transparent",
                  }}
                  onClick={onToggleGitignore}
                  title="展开/编辑当前仓库的 .gitignore 规则清单"
                >
                  🙈 {isGitignoreOpen ? "收起 .gitignore" : "查看/编辑 .gitignore"}
                </button>
              </div>
              <button
                className="btn-secondary"
                style={{ padding: "3px 10px", fontSize: "11px" }}
                onClick={() => onRefreshRepo(repo.path)}
              >
                刷新状态
              </button>
            </div>

            {/* .gitignore 编辑抽屉组件 */}
            <GitignoreDrawer
              isOpen={isGitignoreOpen}
              content={gitignoreContent}
              loading={loadingGitignore}
              saving={savingGitignore}
              onContentChange={onGitignoreContentChange}
              onSave={onSaveGitignore}
              onAppendRule={(rule) => {
                onGitignoreContentChange(
                  gitignoreContent.includes(rule)
                    ? gitignoreContent
                    : gitignoreContent.endsWith("\n") || gitignoreContent.length === 0
                    ? `${gitignoreContent}${rule}\n`
                    : `${gitignoreContent}\n${rule}\n`
                );
              }}
            />

            {loadingDetails ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                正在分析本地索引树与变动文件...
              </div>
            ) : validChangedFiles.length > 0 ? (
              <div className="diff-list-container">
                {validChangedFiles.map((file, idx) => {
                  const normalized = file.file_path.replace(/\\/g, "/");
                  const parts = normalized.split("/");
                  const dirRule = parts.length > 1 ? `${parts[0]}/` : null;

                  const dotIdx = file.file_path.lastIndexOf(".");
                  const ext =
                    dotIdx > 0 && dotIdx < file.file_path.length - 1
                      ? file.file_path.substring(dotIdx + 1).toLowerCase()
                      : null;
                  const extRule =
                    ext && ["iml", "log", "tmp", "bak", "class", "cache", "lock", "xml"].includes(ext)
                      ? `*.${ext}`
                      : null;

                  return (
                    <div key={idx} className="diff-file-row">
                      <span className={`diff-badge ${file.status === "M" ? "m" : file.status === "A" ? "a" : file.status === "D" ? "d" : "untracked"}`}>
                        {file.status}
                      </span>
                      <span style={{ color: "var(--text-main)", flex: 1, wordBreak: "break-all" }}>
                        {file.file_path}
                      </span>

                      {/* 快捷一键忽略动作组 */}
                      <div className="diff-file-actions">
                        {dirRule && (
                          <button
                            className="btn-diff-action ignore"
                            title={`将所属目录 [${dirRule}] 加入 .gitignore`}
                            onClick={() => onQuickAddGitignore(dirRule)}
                          >
                            📁 忽略目录
                          </button>
                        )}
                        {extRule && extRule !== "*.xml" && (
                          <button
                            className="btn-diff-action ignore"
                            title={`将文件模式 [${extRule}] 加入 .gitignore`}
                            onClick={() => onQuickAddGitignore(extRule)}
                          >
                            🏷️ {extRule}
                          </button>
                        )}
                        <button
                          className="btn-diff-action ignore"
                          title={`将具体文件 [${file.file_path}] 加入忽略规则${file.status !== "??" ? "（已跟踪文件将同步执行深度压制使其彻底隐藏）" : ""}`}
                          onClick={() => onDeepIgnore(file.file_path, file.status !== "??")}
                        >
                          🙈 忽略此文件
                        </button>
                        {file.status !== "??" && (
                          <button
                            className="btn-diff-action"
                            title="放弃此文件所有本地修改，还原到 Git 原始提交状态"
                            onClick={() => onDiscardSingleFile(file.file_path)}
                          >
                            ↩️ 还原修改
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--color-clean)", background: "rgba(0,0,0,0.15)", borderRadius: "var(--radius-sm)", fontSize: "12px" }}>
                🟢 工作区纯净，没有检测到任何未提交的代码变动
              </div>
            )}
          </div>

          {/* 最近历史提交 */}
          {repoDetails && repoDetails.recent_commits.length > 0 && (
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "var(--text-secondary)" }}>
                📜 最近提交历史 (最近 {repoDetails.recent_commits.length} 次)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "160px", overflowY: "auto" }}>
                {repoDetails.recent_commits.map((c) => (
                  <div key={c.hash} style={{ background: "rgba(0,0,0,0.15)", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
                    <code style={{ color: "var(--accent-primary)", fontWeight: "600" }}>{c.hash}</code>
                    <span style={{ color: "var(--text-main)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.message}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{c.author} · {c.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 危险操作区：物理删除 */}
          <div style={{
            marginTop: "10px",
            borderTop: "1px dashed rgba(216, 59, 1, 0.3)",
            paddingTop: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: "12.5px", fontWeight: "600", color: "#ff6e4a" }}>
                ⚠️ 磁盘物理清理区
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                若该项目已废弃且无需保留任何本地源码，可彻底从磁盘销毁。
              </div>
            </div>
            <button
              className="btn-secondary"
              style={{ color: "#ff6e4a", borderColor: "rgba(216,59,1,0.4)" }}
              onClick={() => onDeletePhysicalConfirm(repo.path, repo.name)}
            >
              🔥 彻底删除物理文件夹
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
