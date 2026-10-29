import React, { useState } from "react";

interface AddRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCloneBaseDir: string;
  onDefaultCloneBaseDirChange: (val: string) => void;
  onLoadLocalRepo: (path: string, forceBatch: boolean) => Promise<void>;
  onStartCloneRepo: (url: string, targetDir: string) => Promise<void>;
  onPickFolder: (title: string) => Promise<string | null>;
  showNotice: (msg: string) => void;
}

export const AddRepoModal: React.FC<AddRepoModalProps> = ({
  isOpen,
  onClose,
  defaultCloneBaseDir,
  onDefaultCloneBaseDirChange,
  onLoadLocalRepo,
  onStartCloneRepo,
  onPickFolder,
  showNotice,
}) => {
  const [tab, setTab] = useState<"local" | "clone" | "config">("local");
  const [manualPathInput, setManualPathInput] = useState("");
  const [addingRepo, setAddingRepo] = useState(false);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [isPickingFolder, setIsPickingFolder] = useState(false);

  // 克隆表单状态
  const [cloneUrlInput, setCloneUrlInput] = useState("");
  const [cloneTargetDirInput, setCloneTargetDirInput] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const [cloneLog, setCloneLog] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePickLocal = async () => {
    setIsPickingFolder(true);
    try {
      const picked = await onPickFolder("选择本地 Git 仓库或包含多个子项目的根目录");
      if (picked) setManualPathInput(picked);
    } finally {
      setIsPickingFolder(false);
    }
  };

  const handlePickClone = async () => {
    setIsPickingFolder(true);
    try {
      const picked = await onPickFolder("选择克隆项目的存放目标目录");
      if (picked) setCloneTargetDirInput(picked);
    } finally {
      setIsPickingFolder(false);
    }
  };

  const handlePickBase = async () => {
    setIsPickingFolder(true);
    try {
      const picked = await onPickFolder("设置拉取代码的全局默认基准根目录");
      if (picked) {
        onDefaultCloneBaseDirChange(picked);
        showNotice(`已将默认拉取基准根目录设置为: ${picked}`);
        if (cloneUrlInput.trim()) {
          const match = cloneUrlInput.trim().match(/\/([^/]+?)(?:\.git)?$/);
          if (match && match[1]) {
            setCloneTargetDirInput(`${picked}\\${match[1]}`);
          }
        }
      }
    } finally {
      setIsPickingFolder(false);
    }
  };

  const handleUrlChange = (val: string) => {
    setCloneUrlInput(val);
    const trimmed = val.trim();
    if (!trimmed) return;
    const match = trimmed.match(/\/([^/]+?)(?:\.git)?$/);
    if (match && match[1]) {
      const repoName = match[1].replace(/[^a-zA-Z0-9_\-\.]/g, "");
      const base = defaultCloneBaseDir.replace(/[\\/]+$/, "");
      setCloneTargetDirInput(`${base}\\${repoName}`);
    }
  };

  const triggerLoadLocal = async (forceBatch: boolean) => {
    if (!manualPathInput.trim()) {
      showNotice("请输入或选择有效的文件夹物理路径");
      return;
    }
    if (forceBatch) setIsBatchLoading(true);
    else setAddingRepo(true);
    try {
      await onLoadLocalRepo(manualPathInput.trim(), forceBatch);
      setManualPathInput("");
      onClose();
    } finally {
      setAddingRepo(false);
      setIsBatchLoading(false);
    }
  };

  const triggerClone = async () => {
    if (!cloneUrlInput.trim() || !cloneTargetDirInput.trim()) {
      showNotice("请填写完整的远程仓库 URL 和本地目标存放路径");
      return;
    }
    setIsCloning(true);
    setCloneLog("正在连接远程仓库并拉取数据，请稍候...");
    try {
      await onStartCloneRepo(cloneUrlInput.trim(), cloneTargetDirInput.trim());
      setCloneUrlInput("");
      setCloneTargetDirInput("");
      setCloneLog(null);
      onClose();
    } catch (err: any) {
      setCloneLog(`拉取失败: ${err.message || err}`);
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ width: "640px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📦</span> 代码仓库接入与拉取中心
          </h3>
          <button
            style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "18px", cursor: "pointer" }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="modal-body" style={{ gap: "16px" }}>
          {/* 选项卡导航 */}
          <div className="modal-nav-tabs">
            <button
              className={`modal-nav-tab ${tab === "local" ? "active" : ""}`}
              onClick={() => setTab("local")}
            >
              📂 加载本地仓库
            </button>
            <button
              className={`modal-nav-tab ${tab === "clone" ? "active" : ""}`}
              onClick={() => setTab("clone")}
            >
              ⬇️ 远程克隆拉取
            </button>
            <button
              className={`modal-nav-tab ${tab === "config" ? "active" : ""}`}
              onClick={() => setTab("config")}
            >
              ⚙️ 拉取基准目录
            </button>
          </div>

          {/* 选项卡 1：加载本地仓库 */}
          {tab === "local" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                选择或粘贴本地 Git 仓库路径。支持<b>单个仓库直接纳管</b>，或选择包含多个子项目的<b>父级文件夹批量智能导入</b>：
              </p>

              <div className="input-with-action">
                <input
                  type="text"
                  className="search-box"
                  style={{ fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.25)" }}
                  placeholder="例如：D:\code\my-project 或 D:\code\github-repos"
                  value={manualPathInput}
                  onChange={(e) => setManualPathInput(e.target.value)}
                  autoFocus
                />
                <button
                  className="btn-secondary"
                  disabled={isPickingFolder}
                  onClick={handlePickLocal}
                  style={{ whiteSpace: "nowrap", padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px" }}
                  title="打开系统文件夹选择器"
                >
                  📁 浏览选择...
                </button>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", fontSize: "12px", color: "var(--text-muted)" }}>
                💡 提示：若选择的文件夹直接包含 <code>.git</code>，将单仓库秒级导入；若选择的是开发大目录，点击“批量载入子仓库”将瞬间纳管其名下所有子项目。
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button className="btn-secondary" onClick={onClose}>
                  取消
                </button>
                <button
                  className="btn-secondary"
                  disabled={addingRepo || isBatchLoading}
                  onClick={() => triggerLoadLocal(true)}
                  style={{ border: "1px solid var(--accent-primary)", color: "var(--accent-primary)" }}
                >
                  {isBatchLoading ? "正在批量探测..." : "📦 批量载入子仓库"}
                </button>
                <button
                  className="btn-primary"
                  disabled={addingRepo || isBatchLoading}
                  onClick={() => triggerLoadLocal(false)}
                >
                  {addingRepo ? "正在验证仓库..." : "✨ 智能识别载入"}
                </button>
              </div>
            </div>
          )}

          {/* 选项卡 2：远程克隆拉取 */}
          {tab === "clone" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                  远程 Git 仓库拉取地址 (HTTPS / SSH):
                </label>
                <input
                  type="text"
                  className="search-box"
                  style={{ width: "100%", fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.25)" }}
                  placeholder="例如：https://github.com/vuejs/core.git 或 git@github.com:vuejs/core.git"
                  value={cloneUrlInput}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                  本地克隆目标存放物理路径:
                </label>
                <div className="input-with-action">
                  <input
                    type="text"
                    className="search-box"
                    style={{ fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.25)" }}
                    placeholder="例如：D:\code\core"
                    value={cloneTargetDirInput}
                    onChange={(e) => setCloneTargetDirInput(e.target.value)}
                  />
                  <button
                    className="btn-secondary"
                    disabled={isPickingFolder}
                    onClick={handlePickClone}
                    style={{ whiteSpace: "nowrap", padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px" }}
                    title="打开系统文件夹选择器更换存放位置"
                  >
                    📁 更改路径...
                  </button>
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                  基准根目录：<code>{defaultCloneBaseDir}</code>（可在第三个标签页修改）
                </div>
              </div>

              {/* 克隆实时状态与日志显示 */}
              {(isCloning || cloneLog) && (
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    {isCloning ? "⏳ 正在拉取克隆中..." : "📋 Git 操作日志:"}
                  </div>
                  <div className="clone-console-box">{cloneLog}</div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button className="btn-secondary" disabled={isCloning} onClick={onClose}>
                  取消
                </button>
                <button
                  className="btn-primary"
                  disabled={isCloning}
                  onClick={triggerClone}
                >
                  {isCloning ? "正在拉取代码中..." : "⚡ 开始克隆并纳管"}
                </button>
              </div>
            </div>
          )}

          {/* 选项卡 3：默认拉取基准目录配置 */}
          {tab === "config" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                配置您拉取与克隆远程代码时的<b>默认基准存储根目录</b>。后续在“远程克隆拉取”中输入任意 Git URL 时，系统将自动提炼项目名并在此基准目录下创建工程：
              </p>

              <div>
                <label style={{ fontSize: "12.5px", fontWeight: "600", color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                  当前全局默认拉取根目录:
                </label>
                <div className="input-with-action">
                  <input
                    type="text"
                    className="search-box"
                    style={{ fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.25)" }}
                    value={defaultCloneBaseDir}
                    onChange={(e) => onDefaultCloneBaseDirChange(e.target.value)}
                  />
                  <button
                    className="btn-secondary"
                    disabled={isPickingFolder}
                    onClick={handlePickBase}
                    style={{ whiteSpace: "nowrap", padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    📁 浏览设置...
                  </button>
                </div>
              </div>

              <div style={{ background: "rgba(0, 120, 212, 0.08)", border: "1px solid rgba(0, 120, 212, 0.25)", padding: "12px 16px", borderRadius: "var(--radius-sm)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                ℹ️ 提示：修改后将实时持久化保存在本地配置中。在克隆新仓库时，您依然可以针对单个项目自由更改存放目录。
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    showNotice("基准目录配置已生效！");
                    setTab("clone");
                  }}
                >
                  返回克隆面板
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
