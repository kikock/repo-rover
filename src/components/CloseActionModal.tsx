import React, { useState } from "react";

interface CloseActionModalProps {
  isOpen: boolean;
  onHideToTray: (remember: boolean) => void;
  onExitApp: (remember: boolean) => void;
  onCancel: () => void;
}

export const CloseActionModal: React.FC<CloseActionModalProps> = ({
  isOpen,
  onHideToTray,
  onExitApp,
  onCancel,
}) => {
  const [remember, setRemember] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        className="glass-card"
        style={{
          width: 440,
          backgroundColor: "var(--bg-card)",
          boxShadow: "var(--shadow-lg)",
          borderRadius: 12,
          padding: 24,
          border: "1px solid var(--border-subtle)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>关闭窗口提示</h3>
        </div>

        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          您希望将 Repo Rover 缩小至系统托盘继续在后台驻留，还是彻底退出应用程序？
        </p>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontSize: 12.5,
            color: "var(--text-muted)",
            marginBottom: 20,
          }}
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          记住我的选择，下次不再提示（可在「环境设置」中修改）
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn btn-secondary" onClick={onCancel} style={{ fontSize: 13 }}>
            取消
          </button>
          <button
            className="btn btn-danger"
            onClick={() => onExitApp(remember)}
            style={{ fontSize: 13 }}
          >
            彻底退出
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onHideToTray(remember)}
            style={{ fontSize: 13 }}
          >
            缩小到托盘
          </button>
        </div>
      </div>
    </div>
  );
};
