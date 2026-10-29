import React, { useState, useEffect } from "react";

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

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onHideToTray(remember);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, remember, onCancel, onHideToTray]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
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
          boxShadow: "0 20px 48px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--border-subtle)",
          borderRadius: 14,
          padding: 24,
          border: "1px solid var(--border-subtle)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, rgba(0, 120, 212, 0.25), rgba(0, 153, 255, 0.1))",
              border: "1px solid var(--border-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-primary)",
              flexShrink: 0,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v10" />
              <polyline points="8 9 12 13 16 9" />
              <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
              <path d="M4 15h4l2 3h4l2-3h4" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-main)", margin: 0 }}>
              关闭窗口提示
            </h3>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              请选择程序退出或托盘常驻策略
            </span>
          </div>
        </div>

        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>
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
            marginBottom: 24,
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            style={{ accentColor: "var(--accent-primary)", cursor: "pointer", width: 14, height: 14 }}
          />
          <span>记住我的选择，下次不再提示（可在「扫描与剪枝规则」中修改）</span>
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ padding: "7px 14px", fontSize: 12.5, borderRadius: 6 }}
          >
            取消
          </button>
          <button
            className="btn btn-danger"
            onClick={() => onExitApp(remember)}
            style={{
              padding: "7px 14px",
              fontSize: 12.5,
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
            彻底退出
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onHideToTray(remember)}
            style={{
              padding: "7px 16px",
              fontSize: 12.5,
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 12px var(--accent-glow)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v10" />
              <polyline points="8 9 12 13 16 9" />
              <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
              <path d="M4 15h4l2 3h4l2-3h4" />
            </svg>
            缩小到托盘
          </button>
        </div>
      </div>
    </div>
  );
};

