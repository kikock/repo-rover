// 主题配置系统 (对标 RepoRover 与 EnvPilot 现代化全景主题与 40+ 调色盘设计)

export type ThemeMode = "light" | "system" | "dark";

export interface ColorPreset {
  id: string;
  name: string;
  mode: "light" | "dark";
  bgApp: string;
  bgSidebar: string;
  bgCard: string;
  bgSurface: string;
  borderSubtle: string;
  textMain: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
}

export interface ThemeConfig {
  mode: ThemeMode;
  selectedLightPreset: string;
  selectedDarkPreset: string;
  useCustomAccent: boolean;
  customAccent: string;
}

// 浅色主题预设色盘 (30+ 种精致色卡)
export const LIGHT_PRESETS: ColorPreset[] = [
  // 经典中性灰与柔和米白
  { id: "l-snow", name: "雪白", mode: "light", bgApp: "#f8f9fa", bgSidebar: "#ffffff", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(0,0,0,0.08)", textMain: "#1a1a1a", textSecondary: "#666666", textMuted: "#999999", accent: "#0078d4" },
  { id: "l-cool-gray", name: "冷灰", mode: "light", bgApp: "#f1f3f5", bgSidebar: "#e9ecef", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(0,0,0,0.08)", textMain: "#212529", textSecondary: "#495057", textMuted: "#868e96", accent: "#0078d4" },
  { id: "l-warm-ivory", name: "暖象牙", mode: "light", bgApp: "#fbfaf8", bgSidebar: "#f4f1ea", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(0,0,0,0.07)", textMain: "#2b2927", textSecondary: "#605c56", textMuted: "#969087", accent: "#b36b00" },
  { id: "l-cream", name: "奶油杏", mode: "light", bgApp: "#fcf8f2", bgSidebar: "#f7efe3", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(0,0,0,0.07)", textMain: "#2e2820", textSecondary: "#665a48", textMuted: "#9e8d75", accent: "#c26b2b" },
  { id: "l-sand", name: "柔沙", mode: "light", bgApp: "#f7f5f0", bgSidebar: "#ede8df", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(0,0,0,0.08)", textMain: "#2b2723", textSecondary: "#635c54", textMuted: "#998f84", accent: "#996b3d" },
  { id: "l-pure-white", name: "亮白", mode: "light", bgApp: "#ffffff", bgSidebar: "#f5f6f8", bgCard: "#ffffff", bgSurface: "#fafbfc", borderSubtle: "rgba(0,0,0,0.09)", textMain: "#111827", textSecondary: "#4b5563", textMuted: "#9ca3af", accent: "#2563eb" },
  { id: "l-slate", name: "板岩", mode: "light", bgApp: "#f1f5f9", bgSidebar: "#e2e8f0", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(0,0,0,0.08)", textMain: "#0f172a", textSecondary: "#475569", textMuted: "#94a3b8", accent: "#0ea5e9" },
  { id: "l-zinc", name: "锌白", mode: "light", bgApp: "#f4f4f5", bgSidebar: "#e4e4e7", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(0,0,0,0.08)", textMain: "#18181b", textSecondary: "#52525b", textMuted: "#a1a1aa", accent: "#6366f1" },
  { id: "l-neutral", name: "中性", mode: "light", bgApp: "#f5f5f5", bgSidebar: "#e5e5e5", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(0,0,0,0.08)", textMain: "#171717", textSecondary: "#525252", textMuted: "#a3a3a3", accent: "#10b981" },
  { id: "l-stone", name: "暖石", mode: "light", bgApp: "#f5f5f4", bgSidebar: "#e7e5e4", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(0,0,0,0.08)", textMain: "#1c1917", textSecondary: "#57534e", textMuted: "#a8a29e", accent: "#f59e0b" },

  // 柔和马卡龙清爽色相
  { id: "l-ice-blue", name: "冰蓝", mode: "light", bgApp: "#f0f7ff", bgSidebar: "#e0effe", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(0,120,212,0.12)", textMain: "#0c2340", textSecondary: "#305680", textMuted: "#6b8cae", accent: "#0078d4" },
  { id: "l-mint", name: "薄荷", mode: "light", bgApp: "#f0fdf4", bgSidebar: "#dcfce7", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(16,124,65,0.12)", textMain: "#064e3b", textSecondary: "#047857", textMuted: "#34d399", accent: "#107c41" },
  { id: "l-lavender", name: "薰衣草", mode: "light", bgApp: "#faf5ff", bgSidebar: "#f3e8ff", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(147,51,234,0.12)", textMain: "#3b0764", textSecondary: "#6b21a8", textMuted: "#a855f7", accent: "#8b5cf6" },
  { id: "l-sakura", name: "樱粉", mode: "light", bgApp: "#fff1f2", bgSidebar: "#ffe4e6", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(225,29,72,0.12)", textMain: "#4c0519", textSecondary: "#881337", textMuted: "#fb7185", accent: "#e11d48" },
  { id: "l-peach", name: "蜜桃", mode: "light", bgApp: "#fff7ed", bgSidebar: "#ffedd5", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(234,88,12,0.12)", textMain: "#431407", textSecondary: "#7c2d12", textMuted: "#fb923c", accent: "#ea580c" },
  { id: "l-amber", name: "琥珀", mode: "light", bgApp: "#fffbeb", bgSidebar: "#fef3c7", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(217,119,6,0.12)", textMain: "#451a03", textSecondary: "#78350f", textMuted: "#f59e0b", accent: "#d97706" },
  { id: "l-cyan", name: "水清", mode: "light", bgApp: "#ecfeff", bgSidebar: "#cffafe", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(8,145,178,0.12)", textMain: "#083344", textSecondary: "#0e7490", textMuted: "#22d3ee", accent: "#0891b2" },
  { id: "l-teal", name: "碧绿", mode: "light", bgApp: "#f0fdfa", bgSidebar: "#ccfbf1", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(13,148,136,0.12)", textMain: "#042f2e", textSecondary: "#0f766e", textMuted: "#2dd4bf", accent: "#0d9488" },
  { id: "l-rose", name: "玫瑰", mode: "light", bgApp: "#fff1f2", bgSidebar: "#ffe4e6", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(244,63,94,0.12)", textMain: "#4c0519", textSecondary: "#9f1239", textMuted: "#f43f5e", accent: "#f43f5e" },
  { id: "l-lime", name: "青柠", mode: "light", bgApp: "#f7fee7", bgSidebar: "#ecfccb", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(101,163,13,0.12)", textMain: "#1a2e05", textSecondary: "#365314", textMuted: "#84cc16", accent: "#65a30d" },

  // 莫兰迪典雅低饱和
  { id: "l-morandi-blue", name: "莫兰迪蓝", mode: "light", bgApp: "#eef2f6", bgSidebar: "#dfe6ee", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(71,85,105,0.12)", textMain: "#1e293b", textSecondary: "#475569", textMuted: "#64748b", accent: "#475569" },
  { id: "l-morandi-green", name: "莫兰迪绿", mode: "light", bgApp: "#eef4f1", bgSidebar: "#dde7e1", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(47,79,79,0.12)", textMain: "#1c2b24", textSecondary: "#3d574c", textMuted: "#6b877b", accent: "#3d574c" },
  { id: "l-morandi-clay", name: "陶土", mode: "light", bgApp: "#f4ede8", bgSidebar: "#e8ded6", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(120,80,60,0.12)", textMain: "#2e211b", textSecondary: "#5a443b", textMuted: "#8a7065", accent: "#7c5545" },
  { id: "l-morandi-purple", name: "暮紫", mode: "light", bgApp: "#f2edf5", bgSidebar: "#e5dceb", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(90,60,110,0.12)", textMain: "#281b30", textSecondary: "#4e395c", textMuted: "#795f8a", accent: "#634b75" },
  { id: "l-mist", name: "薄雾", mode: "light", bgApp: "#f3f4f6", bgSidebar: "#e5e7eb", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(0,0,0,0.08)", textMain: "#111827", textSecondary: "#4b5563", textMuted: "#9ca3af", accent: "#4b5563" },
  { id: "l-pearl", name: "珍珠", mode: "light", bgApp: "#fafaf9", bgSidebar: "#f0efe9", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(0,0,0,0.07)", textMain: "#292524", textSecondary: "#57534e", textMuted: "#a8a29e", accent: "#78716c" },
  { id: "l-linen", name: "亚麻", mode: "light", bgApp: "#f7f6f2", bgSidebar: "#ebe9e1", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(0,0,0,0.07)", textMain: "#262420", textSecondary: "#59544c", textMuted: "#8c8478", accent: "#827768" },
  { id: "l-ceramic", name: "青瓷", mode: "light", bgApp: "#f2f7f6", bgSidebar: "#e1edea", bgCard: "#ffffff", bgSurface: "#ffffff", borderSubtle: "rgba(0,100,90,0.1)", textMain: "#162826", textSecondary: "#345550", textMuted: "#5c827c", accent: "#2d6a62" },
];

// 深色主题预设色盘
export const DARK_PRESETS: ColorPreset[] = [
  { id: "d-default", name: "深邃黑", mode: "dark", bgApp: "#18191b", bgSidebar: "rgba(26,27,30,0.85)", bgCard: "rgba(35,37,41,0.8)", bgSurface: "#202124", borderSubtle: "rgba(255,255,255,0.08)", textMain: "#f3f3f3", textSecondary: "#9ea5b0", textMuted: "#6c7380", accent: "#0078d4" },
  { id: "d-pure-black", name: "纯黑", mode: "dark", bgApp: "#0a0a0c", bgSidebar: "#111114", bgCard: "#16161a", bgSurface: "#1a1a1f", borderSubtle: "rgba(255,255,255,0.1)", textMain: "#ffffff", textSecondary: "#a1a1aa", textMuted: "#71717a", accent: "#3b82f6" },
  { id: "d-night-blue", name: "星夜蓝", mode: "dark", bgApp: "#0d1117", bgSidebar: "#161b22", bgCard: "#21262d", bgSurface: "#161b22", borderSubtle: "rgba(255,255,255,0.1)", textMain: "#c9d1d9", textSecondary: "#8b949e", textMuted: "#6e7681", accent: "#58a6ff" },
  { id: "d-titanium", name: "钛金灰", mode: "dark", bgApp: "#1e1e24", bgSidebar: "#25252d", bgCard: "#2b2b36", bgSurface: "#25252d", borderSubtle: "rgba(255,255,255,0.09)", textMain: "#e2e2ea", textSecondary: "#9898a6", textMuted: "#6f6f7d", accent: "#8b5cf6" },
  { id: "d-forest", name: "冷杉绿", mode: "dark", bgApp: "#0e1713", bgSidebar: "#13211b", bgCard: "#1a2c24", bgSurface: "#13211b", borderSubtle: "rgba(16,185,129,0.15)", textMain: "#e6f4ea", textSecondary: "#a7d7b8", textMuted: "#5e9b75", accent: "#10b981" },
  { id: "d-violet", name: "极光紫", mode: "dark", bgApp: "#15101e", bgSidebar: "#1d162b", bgCard: "#281e3b", bgSurface: "#1d162b", borderSubtle: "rgba(168,85,247,0.15)", textMain: "#f3e8ff", textSecondary: "#c084fc", textMuted: "#7e22ce", accent: "#a855f7" },
  { id: "d-ruby", name: "暗榴红", mode: "dark", bgApp: "#1a1012", bgSidebar: "#251619", bgCard: "#331f23", bgSurface: "#251619", borderSubtle: "rgba(244,63,94,0.15)", textMain: "#ffe4e6", textSecondary: "#fda4af", textMuted: "#9f1239", accent: "#f43f5e" },
  { id: "d-amber-dark", name: "曜金", mode: "dark", bgApp: "#191408", bgSidebar: "#241c0b", bgCard: "#30260e", bgSurface: "#241c0b", borderSubtle: "rgba(245,158,11,0.15)", textMain: "#fef3c7", textSecondary: "#fcd34d", textMuted: "#b45309", accent: "#f59e0b" },
];

// 强调色预设选项 (丰富且高质感)
export const ACCENT_PRESETS = [
  { name: "微软蓝", color: "#0078d4" },
  { name: "星空蓝", color: "#2563eb" },
  { name: "极光青", color: "#00b7c3" },
  { name: "翡翠绿", color: "#107c41" },
  { name: "薄荷绿", color: "#10b981" },
  { name: "炽焰橙", color: "#d83b01" },
  { name: "阳光黄", color: "#ffb900" },
  { name: "紫罗兰", color: "#8764b8" },
  { name: "魅惑紫", color: "#a855f7" },
  { name: "玫瑰粉", color: "#e3008c" },
  { name: "板岩灰", color: "#64748b" },
];

const STORAGE_KEY = "reporover_theme_config";

export const getThemeConfig = (): ThemeConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    mode: "dark",
    selectedLightPreset: "l-snow",
    selectedDarkPreset: "d-default",
    useCustomAccent: false,
    customAccent: "#0078d4",
  };
};

export const saveThemeConfig = (cfg: ThemeConfig): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  applyThemeConfig(cfg);
};

export const applyThemeConfig = (cfg: ThemeConfig): void => {
  const root = document.documentElement;

  // 1. 判断实际模式 (考虑 system)
  let effectiveMode: "light" | "dark" = "dark";
  if (cfg.mode === "system") {
    effectiveMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } else {
    effectiveMode = cfg.mode;
  }

  root.setAttribute("data-theme", effectiveMode);

  // 2. 获取预设
  const preset =
    effectiveMode === "light"
      ? LIGHT_PRESETS.find((p) => p.id === cfg.selectedLightPreset) || LIGHT_PRESETS[0]
      : DARK_PRESETS.find((p) => p.id === cfg.selectedDarkPreset) || DARK_PRESETS[0];

  // 3. 应用背景与表面颜色
  root.style.setProperty("--bg-app", preset.bgApp);
  root.style.setProperty("--bg-sidebar", preset.bgSidebar);
  root.style.setProperty("--bg-card", preset.bgCard);
  root.style.setProperty("--bg-surface", preset.bgSurface);
  root.style.setProperty("--border-subtle", preset.borderSubtle);
  root.style.setProperty("--text-main", preset.textMain);
  root.style.setProperty("--text-secondary", preset.textSecondary);
  root.style.setProperty("--text-muted", preset.textMuted);

  // 4. 应用强调色
  const activeAccent = cfg.useCustomAccent && cfg.customAccent ? cfg.customAccent : preset.accent;
  root.style.setProperty("--accent-primary", activeAccent);
  root.style.setProperty("--accent-hover", adjustColorBrightness(activeAccent, effectiveMode === "dark" ? 20 : -20));
  root.style.setProperty("--accent-glow", `${activeAccent}33`);
  root.style.setProperty("--border-accent", `${activeAccent}55`);
};

// 辅助微调颜色明暗
function adjustColorBrightness(hex: string, percent: number): string {
  let num = parseInt(hex.replace("#", ""), 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
