// 全局共享类型定义

export type NavTab = "dashboard" | "repos" | "git-env" | "settings";

export type StatusFilter = "all" | "dirty" | "unpushed" | "clean";

export interface ConfirmModalConfig {
  isOpen: boolean;
  title: string;
  description: string;
  warningNote?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: "warning" | "critical" | "info";
  isCriticalInput?: boolean;
  targetVerifyText?: string;
  onConfirm: () => void | Promise<void>;
}
