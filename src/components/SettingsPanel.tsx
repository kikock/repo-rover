import React from "react";
import {
  ThemeConfig,
  ThemeMode,
  LIGHT_PRESETS,
  DARK_PRESETS,
  ACCENT_PRESETS,
} from "../services/theme";

interface SettingsPanelProps {
  themeCfg: ThemeConfig;
  scanRoots: string;
  customExcludes: string;
  onThemeModeChange: (mode: ThemeMode) => void;
  onSelectPreset: (presetId: string, mode: "light" | "dark") => void;
  onToggleCustomAccent: (useCustom: boolean) => void;
  onSelectAccentColor: (color: string) => void;
  onScanRootsChange: (val: string) => void;
  onCustomExcludesChange: (val: string) => void;
  onSaveExcludes: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  themeCfg,
  scanRoots,
  customExcludes,
  onThemeModeChange,
  onSelectPreset,
  onToggleCustomAccent,
  onSelectAccentColor,
  onScanRootsChange,
  onCustomExcludesChange,
  onSaveExcludes,
}) => {
  return (
    <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 现代主题配置卡片 */}
      <div className="theme-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "15px", fontWeight: 600 }}>🎨 外观与主题模式</span>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              自定义 Repo Rover 界面光暗与调色盘，即选即生效并本地持久化
            </div>
          </div>
          <div className="theme-segmented">
            <button
              className={`theme-seg-btn ${themeCfg.mode === "light" ? "active" : ""}`}
              onClick={() => onThemeModeChange("light")}
            >
              <span>☼</span> 浅色
            </button>
            <button
              className={`theme-seg-btn ${themeCfg.mode === "system" ? "active" : ""}`}
              onClick={() => onThemeModeChange("system")}
            >
              <span>💻</span> 系统
            </button>
            <button
              className={`theme-seg-btn ${themeCfg.mode === "dark" ? "active" : ""}`}
              onClick={() => onThemeModeChange("dark")}
            >
              <span>☾</span> 深色
            </button>
          </div>
        </div>

        <div style={{ height: "1px", background: "var(--border-subtle)", margin: "0 -4px" }} />

        {/* 主题色盘 (圆形色块列表 40+ 种) */}
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px", color: "var(--text-main)" }}>
            {themeCfg.mode === "dark" ? "深色主题色盘 (8 款精雕细琢)" : "浅色主题色盘 (28 款典雅色系)"}
          </div>
          <div className="palette-grid">
            {(themeCfg.mode === "dark" ? DARK_PRESETS : LIGHT_PRESETS).map((preset) => {
              const isSelected =
                themeCfg.mode === "dark"
                  ? preset.id === themeCfg.selectedDarkPreset
                  : preset.id === themeCfg.selectedLightPreset;
              return (
                <div
                  key={preset.id}
                  className={`color-swatch-circle ${isSelected ? "selected" : ""}`}
                  style={{
                    backgroundColor: preset.bgApp,
                    border: `1.5px solid ${preset.borderSubtle}`,
                  }}
                  onClick={() => onSelectPreset(preset.id, preset.mode)}
                  title={`${preset.name} (${preset.bgApp})`}
                >
                  {isSelected && (
                    <span
                      className="check-mark"
                      style={{
                        color: preset.mode === "light" ? "#1a1a1a" : "#ffffff",
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ height: "1px", background: "var(--border-subtle)", margin: "0 -4px" }} />

        {/* 使用自定义强调色 Switch 开关 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>使用自定义强调色</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                覆盖主题自带的品牌强调色
              </div>
            </div>
            <label className="fluent-switch">
              <input
                type="checkbox"
                checked={themeCfg.useCustomAccent}
                onChange={(e) => onToggleCustomAccent(e.target.checked)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          {themeCfg.useCustomAccent && (
            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px dashed var(--border-subtle)" }}>
              <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "10px" }}>
                选择预设强调色，或输入十六进制颜色码：
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                {ACCENT_PRESETS.map((item) => (
                  <button
                    key={item.color}
                    className="fluent-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      fontSize: "12px",
                      border:
                        themeCfg.customAccent.toLowerCase() === item.color.toLowerCase()
                          ? `2px solid ${item.color}`
                          : "1px solid var(--border-subtle)",
                      background: "rgba(0,0,0,0.1)",
                      borderRadius: "16px",
                    }}
                    onClick={() => onSelectAccentColor(item.color)}
                  >
                    <span
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: item.color,
                        display: "inline-block",
                      }}
                    />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-md)",
          padding: "24px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <h3 style={{ fontSize: "16px", marginBottom: "14px" }}>🛡️ 扫描根路径配置 (按行分割)</h3>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
          指定扫描程序需要遍历的磁盘盘符或开发目录。
        </p>
        <textarea
          rows={4}
          value={scanRoots}
          onChange={(e) => onScanRootsChange(e.target.value)}
          style={{
            width: "100%",
            background: "rgba(0,0,0,0.2)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-main)",
            padding: "10px",
            fontFamily: "var(--font-mono)",
            fontSize: "12.5px",
          }}
        />
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-md)",
          padding: "24px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <h3 style={{ fontSize: "16px", marginBottom: "14px" }}>✂️ 深度剪枝忽略黑名单 (遇到即停止递归)</h3>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
          关键性能防线：遍历文件系统时，一旦命中以下目录名将立即终止深入，避免消耗大量 I/O：
        </p>
        <textarea
          rows={5}
          value={customExcludes}
          onChange={(e) => onCustomExcludesChange(e.target.value)}
          style={{
            width: "100%",
            background: "rgba(0,0,0,0.2)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-main)",
            padding: "10px",
            fontFamily: "var(--font-mono)",
            fontSize: "12.5px",
          }}
        />
        <div style={{ marginTop: "12px" }}>
          <button className="btn-primary" onClick={onSaveExcludes}>
            保存剪枝规则
          </button>
        </div>
      </div>
    </div>
  );
};
