import React from "react";

interface GitignoreDrawerProps {
  isOpen: boolean;
  content: string;
  loading: boolean;
  saving: boolean;
  onContentChange: (val: string) => void;
  onSave: () => void;
  onAppendRule: (rule: string) => void;
}

const TEMPLATE_RULES = [
  { label: "IntelliJ/IDE (.idea/)", rule: ".idea/" },
  { label: "IDEA 模块 (*.iml)", rule: "*.iml" },
  { label: "VS Code (.vscode/)", rule: ".vscode/" },
  { label: "Node.js (node_modules/)", rule: "node_modules/" },
  { label: "Maven/Java (target/)", rule: "target/" },
  { label: "日志文件 (*.log)", rule: "*.log" },
  { label: "macOS 缓存 (.DS_Store)", rule: ".DS_Store" },
  { label: "临时缓存 (*.tmp)", rule: "*.tmp" },
];

export const GitignoreDrawer: React.FC<GitignoreDrawerProps> = ({
  isOpen,
  content,
  loading,
  saving,
  onContentChange,
  onSave,
  onAppendRule,
}) => {
  if (!isOpen) return null;

  return (
    <div className="gitignore-panel" style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-main)" }}>
          🙈 .gitignore 忽略规则清单 (位于项目根目录)
        </span>
        <button
          className="btn-primary"
          style={{ padding: "3px 12px", fontSize: "11.5px" }}
          disabled={saving}
          onClick={onSave}
        >
          {saving ? "正在保存..." : "💾 保存并立即生效"}
        </button>
      </div>

      {/* 常用模板一键快捷追加 */}
      <div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
          常用开发忽略模板 (点击直接追加)：
        </div>
        <div className="gitignore-tag-chips">
          {TEMPLATE_RULES.map((item) => (
            <span
              key={item.rule}
              className="tag-chip"
              title={`追加 ${item.rule} 到 .gitignore`}
              onClick={() => onAppendRule(item.rule)}
            >
              + {item.label}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
          正在读取 .gitignore 规则...
        </div>
      ) : (
        <textarea
          className="gitignore-textarea"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="# 每行一条忽略规则，例如：&#10;.idea/&#10;*.iml&#10;target/&#10;node_modules/"
        />
      )}
    </div>
  );
};
