import React, { useState, useEffect } from "react";
import { ConfirmModalConfig } from "../types";

interface ConfirmModalProps {
  config: ConfirmModalConfig;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ config, onClose }) => {
  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    if (config.isOpen) {
      setInputVal("");
    }
  }, [config.isOpen]);

  if (!config.isOpen) return null;

  const isDanger = config.icon === "critical";
  const isInputValid = !config.isCriticalInput || inputVal === config.targetVerifyText;

  return (
    <div className="confirm-backdrop" onClick={onClose}>
      <div
        className={`confirm-card ${config.isCriticalInput ? "critical" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-header">
          <div className={`confirm-icon-box ${isDanger ? "critical" : "warning"}`}>
            {isDanger ? "🔥" : "⚠️"}
          </div>
          <div>
            <div className="confirm-title">{config.title}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              Repo Rover 资产安全防护中枢
            </div>
          </div>
        </div>

        <div className="confirm-desc" style={{ whiteSpace: "pre-line" }}>
          {config.description}
        </div>

        {config.warningNote && (
          <div className="confirm-danger-banner">
            {config.warningNote}
          </div>
        )}

        {config.isCriticalInput && (
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
              项目名校验：<strong style={{ color: "#ff6e4a", fontFamily: "var(--font-mono)" }}>{config.targetVerifyText}</strong>
            </div>
            <input
              type="text"
              className="confirm-input-field"
              placeholder={`在此输入项目名 [${config.targetVerifyText}] 以激活删除按钮`}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && isInputValid) {
                  config.onConfirm();
                }
              }}
            />
          </div>
        )}

        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onClose}>
            {config.cancelText || "取消"}
          </button>
          <button
            className={isDanger ? "btn-confirm-danger" : "btn-primary"}
            disabled={!isInputValid}
            onClick={() => config.onConfirm()}
          >
            {config.confirmText || "确定"}
          </button>
        </div>
      </div>
    </div>
  );
};
