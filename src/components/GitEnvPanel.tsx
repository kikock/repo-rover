import React from "react";
import { GitEnvironmentInfo } from "../services/api";

interface GitEnvPanelProps {
  gitEnv: GitEnvironmentInfo | null;
  editUserName: string;
  editUserEmail: string;
  editAutoCrlf: string;
  onUserNameChange: (val: string) => void;
  onUserEmailChange: (val: string) => void;
  onAutoCrlfChange: (val: string) => void;
  onSaveGitConfig: () => void;
  onCopySshKey: (content: string) => void;
}

export const GitEnvPanel: React.FC<GitEnvPanelProps> = ({
  gitEnv,
  editUserName,
  editUserEmail,
  editAutoCrlf,
  onUserNameChange,
  onUserEmailChange,
  onAutoCrlfChange,
  onSaveGitConfig,
  onCopySshKey,
}) => {
  return (
    <div style={{ maxWidth: "800px" }}>
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-md)",
          padding: "24px",
          border: "1px solid var(--border-subtle)",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ fontSize: "16px", marginBottom: "14px" }}>📌 系统 Git 运行时就绪状态</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>安装就绪指示：</span>
            <strong style={{ color: gitEnv?.is_installed ? "var(--color-clean)" : "var(--color-dirty)" }}>
              {gitEnv?.is_installed ? "🟢 已安装并就绪" : "🔴 未探查到 Git 运行时"}
            </strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Git 可执行物理路径：</span>
            <code style={{ fontFamily: "var(--font-mono)" }}>{gitEnv?.git_path || "未检测到"}</code>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>运行时版本号：</span>
            <code>{gitEnv?.git_version || "未知"}</code>
          </div>
        </div>
      </div>

      {/* 全局配置修改 */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-md)",
          padding: "24px",
          border: "1px solid var(--border-subtle)",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ fontSize: "16px", marginBottom: "14px" }}>⚙️ 全局配置托管 (git config --global)</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", marginBottom: "6px" }}>用户全名 (user.name)</label>
            <input
              type="text"
              className="search-box"
              style={{ width: "100%", background: "rgba(0,0,0,0.2)" }}
              value={editUserName}
              onChange={(e) => onUserNameChange(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", marginBottom: "6px" }}>用户邮箱 (user.email)</label>
            <input
              type="email"
              className="search-box"
              style={{ width: "100%", background: "rgba(0,0,0,0.2)" }}
              value={editUserEmail}
              onChange={(e) => onUserEmailChange(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", marginBottom: "6px" }}>Windows 换行符策略 (core.autocrlf)</label>
            <select
              value={editAutoCrlf}
              onChange={(e) => onAutoCrlfChange(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-main)",
                outline: "none",
              }}
            >
              <option value="true">true (Windows 推荐：检出时转 CRLF，提交时转 LF)</option>
              <option value="input">input (提交时转 LF，检出时不转换)</option>
              <option value="false">false (不做任何换行符转换)</option>
            </select>
          </div>

          <button className="btn-primary" style={{ width: "fit-content" }} onClick={onSaveGitConfig}>
            💾 写入并应用全局配置
          </button>
        </div>
      </div>

      {/* SSH 密钥管理 */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-md)",
          padding: "24px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <h3 style={{ fontSize: "16px", marginBottom: "14px" }}>🔑 SSH 密钥与公钥一览</h3>
        {gitEnv?.ssh_keys && gitEnv.ssh_keys.length > 0 ? (
          <div>
            {gitEnv.ssh_keys.map((k) => (
              <div
                key={k.name}
                style={{
                  background: "rgba(0,0,0,0.2)",
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <strong style={{ fontSize: "13px" }}>{k.name}</strong>
                  <button
                    className="btn-secondary"
                    onClick={() => onCopySshKey(k.public_key_content)}
                  >
                    复制公钥
                  </button>
                </div>
                <code style={{ fontSize: "11px", wordBreak: "break-all", color: "var(--text-muted)" }}>
                  {k.public_key_content}
                </code>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            未在 <code>~/.ssh/</code> 目录下检测到可用 <code>.pub</code> 公钥文件。
          </div>
        )}
      </div>
    </div>
  );
};
