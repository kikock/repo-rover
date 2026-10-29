// Tauri API 封装与浏览器开发降级容灾桥梁

export interface RepoHealth {
  name: string;
  path: string;
  branch: string;
  is_clean: boolean;
  is_dirty: boolean;
  unstaged_count: number;
  staged_count: number;
  untracked_count: number;
  ahead_count: number;
  behind_count: number;
  remote_url?: string;
  remote_provider?: string;
  last_commit_msg?: string;
  last_commit_time?: string;
  last_commit_hash?: string;
}

export interface SshKeyInfo {
  name: string;
  public_key_path: string;
  public_key_content: string;
}

export interface GitEnvironmentInfo {
  is_installed: boolean;
  git_path?: string;
  git_version?: string;
  global_configs: Record<string, string>;
  ssh_keys: SshKeyInfo[];
}

export interface ScanOptions {
  root_paths: string[];
  custom_exclusions: string[];
}

// 检测是否在 Tauri 运行时环境内
export const isTauriEnv = (): boolean => {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
};

// 预设本地演示数据 (当在纯 Web 浏览器预览时自动使用)
const MOCK_REPOS: RepoHealth[] = [
  {
    name: "09_mise-manager",
    path: "D:\\code\\09_mise-manager",
    branch: "main",
    is_clean: false,
    is_dirty: true,
    unstaged_count: 3,
    staged_count: 0,
    untracked_count: 1,
    ahead_count: 1,
    behind_count: 0,
    remote_url: "https://github.com/kikock/mise-manager.git",
    remote_provider: "GitHub",
    last_commit_msg: "feat: 新增 Fluent 浅色模式主题与快速截图脚本",
    last_commit_time: "2026-10-26 18:30",
    last_commit_hash: "a8f3b2c"
  },
  {
    name: "10_repo-rover",
    path: "D:\\code\\10_repo-rover",
    branch: "master",
    is_clean: false,
    is_dirty: true,
    unstaged_count: 0,
    staged_count: 4,
    untracked_count: 2,
    ahead_count: 0,
    behind_count: 0,
    remote_url: "https://github.com/kikock/repo-rover.git",
    remote_provider: "GitHub",
    last_commit_msg: "init: 完成 Tauri 2.x + Rust 剪枝扫描核心架构搭建",
    last_commit_time: "2026-10-27 13:45",
    last_commit_hash: "7e2a901"
  },
  {
    name: "mcsmanager-service",
    path: "D:\\code\\04_群晖\\MCSManager与僵尸生存",
    branch: "production",
    is_clean: true,
    is_dirty: false,
    unstaged_count: 0,
    staged_count: 0,
    untracked_count: 0,
    ahead_count: 0,
    behind_count: 0,
    remote_url: "https://gitee.com/kikock/mcsmanager-deploy.git",
    remote_provider: "Gitee",
    last_commit_msg: "fix: 修复 Docker 守护进程村民交易刷取异常",
    last_commit_time: "2026-10-25 11:20",
    last_commit_hash: "c3d4e5f"
  },
  {
    name: "gfw-rule-sync",
    path: "D:\\code\\03_gfw",
    branch: "main",
    is_clean: true,
    is_dirty: false,
    unstaged_count: 0,
    staged_count: 0,
    untracked_count: 0,
    ahead_count: 2,
    behind_count: 0,
    remote_url: "https://gitlab.com/kikock/gfw-sync.git",
    remote_provider: "GitLab",
    last_commit_msg: "chore: 更新 Clash DNS 防泄漏分流规则清单",
    last_commit_time: "2026-10-26 14:10",
    last_commit_hash: "9b0c1d2"
  }
];

export async function getGitEnvironment(): Promise<GitEnvironmentInfo> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("get_git_environment_cmd");
  }
  // Web 降级演示模式
  return {
    is_installed: true,
    git_path: "D:\\developmentTool\\git-for-windows\\bin\\git.exe",
    git_version: "git version 2.56.0.2.windows.1",
    global_configs: {
      "user.name": "kikock",
      "user.email": "kikock@example.com",
      "core.autocrlf": "true",
      "init.defaultBranch": "main",
      "credential.helper": "manager"
    },
    ssh_keys: [
      {
        name: "id_ed25519.pub",
        public_key_path: "C:\\Users\\ck\\.ssh\\id_ed25519.pub",
        public_key_content: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIG3Z2lP4k0s9Aabcdef... kikock@personal"
      }
    ]
  };
}

export async function setGitConfig(key: string, value: string): Promise<void> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("set_git_config_cmd", { key, value });
  } else {
    console.log(`[Web模式] 模拟写入 Git 配置: ${key} = ${value}`);
  }
}

export async function startScan(
  options: ScanOptions,
  onRepoFound?: (repo: RepoHealth) => void,
  onProgress?: (dir: string) => void
): Promise<RepoHealth[]> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    let unlistenRepo = () => {};
    let unlistenProgress = () => {};

    try {
      const { listen } = await import("@tauri-apps/api/event");
      unlistenRepo = await listen<RepoHealth>("scan_repo_found", (event) => {
        onRepoFound?.(event.payload);
      });
      unlistenProgress = await listen<{ current_directory: string }>("scan_progress", (event) => {
        onProgress?.(event.payload.current_directory);
      });
    } catch (err) {
      console.warn("事件监听暂时降级，由底层命令同步托底返回:", err);
    }

    try {
      const results = await invoke<RepoHealth[]>("start_scan_cmd", { options });
      if (Array.isArray(results)) {
        results.forEach((r) => onRepoFound?.(r));
      }
      return results;
    } finally {
      try {
        unlistenRepo();
        unlistenProgress();
      } catch (_) {}
    }
  }

  // Web 模式模拟渐进式流式扫描
  for (const repo of MOCK_REPOS) {
    onProgress?.(repo.path);
    await new Promise((r) => setTimeout(r, 260));
    onRepoFound?.(repo);
  }
  return MOCK_REPOS;
}

export interface ChangedFileInfo {
  status: string;
  file_path: string;
}

export interface CommitItem {
  hash: string;
  date: string;
  author: string;
  message: string;
}

export interface RepoDetailInfo {
  remote_url?: string;
  changed_files: ChangedFileInfo[];
  recent_commits: CommitItem[];
  branches: string[];
}

export async function getRepoDetails(repoPath: string): Promise<RepoDetailInfo> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<RepoDetailInfo>("get_repo_details_cmd", { repoPath });
  }
  // Web 模式 Mock 演示
  return {
    changed_files: [
      { status: "M", file_path: "src/App.tsx" },
      { status: "M", file_path: "src/services/api.ts" },
      { status: "??", file_path: "docs/git-workflow.md" }
    ],
    recent_commits: [
      { hash: "7a8b9c0", date: "2026-10-28 18:30", author: "caokui", message: "feat: 新增项目专属 Git 运维控制台与变动文件视窗" },
      { hash: "1c2d3e4", date: "2026-10-28 16:45", author: "caokui", message: "fix: 彻底消除后台子进程黑色控制台闪现" }
    ],
    branches: ["main", "master", "develop"]
  };
}

export async function executeGitAction(repoPath: string, action: string): Promise<string> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("execute_git_action_cmd", { repoPath, action });
  }
  await new Promise((r) => setTimeout(r, 600));
  return `[Web模式] 模拟执行 Git ${action} 成功完成`;
}

export async function openInExplorer(repoPath: string): Promise<void> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("open_explorer_cmd", { repoPath });
  } else {
    alert(`[Web模式] 模拟在资源管理器中定位: ${repoPath}`);
  }
}

export async function openInTerminal(repoPath: string): Promise<void> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("open_terminal_cmd", { repoPath });
  } else {
    alert(`[Web模式] 模拟在终端中打开目录: ${repoPath}`);
  }
}

export async function openInBrowser(url: string): Promise<void> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("open_browser_cmd", { url });
  } else {
    window.open(url, "_blank");
  }
}

export async function inspectSingleRepo(repoPath: string): Promise<RepoHealth> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<RepoHealth>("inspect_repo_cmd", { repoPath });
  }
  throw new Error("Mock");
}

export async function deletePhysicalRepo(repoPath: string): Promise<void> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("delete_physical_repo_cmd", { repoPath });
  } else {
    alert(`[Web模式] 模拟删除本地物理文件夹: ${repoPath}`);
  }
}

export async function getGitignoreContent(repoPath: string): Promise<string> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("get_gitignore_content_cmd", { repoPath });
  }
  return "# Web模式 Mock .gitignore\nnode_modules/\ndist/\n.idea/\n*.log\n";
}

export async function saveGitignoreContent(repoPath: string, content: string): Promise<void> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("save_gitignore_content_cmd", { repoPath, content });
  } else {
    console.log(`[Web模式] 模拟写入 .gitignore: ${repoPath}`, content);
  }
}

export async function addToGitignore(repoPath: string, rule: string): Promise<void> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("add_to_gitignore_cmd", { repoPath, rule });
  } else {
    console.log(`[Web模式] 模拟追加 .gitignore 规则: ${rule}`);
  }
}

export async function ignoreFileDeep(repoPath: string, filePath: string, isTracked: boolean): Promise<void> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("ignore_file_deep_cmd", { repoPath, filePath, isTracked });
  } else {
    console.log(`[Web模式] 模拟深度忽略文件: ${filePath}`);
  }
}

export async function discardSingleFile(repoPath: string, filePath: string): Promise<void> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("discard_single_file_cmd", { repoPath, filePath });
  } else {
    console.log(`[Web模式] 模拟单文件还原: ${filePath}`);
  }
}

export async function pickFolder(title: string = "请选择文件夹"): Promise<string | null> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string | null>("pick_folder_cmd", { title });
  }
  return prompt("[Web模式模拟] 请输入本地文件夹路径:", "D:\\code\\my-new-repo");
}

export async function cloneRemoteRepo(url: string, destinationDir: string): Promise<string> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("clone_remote_repo_cmd", { url, destinationDir });
  }
  await new Promise((r) => setTimeout(r, 1200));
  return `[Web模式] 模拟克隆 ${url} -> ${destinationDir} 成功完成`;
}

export async function configureRemoteUrl(repoPath: string, remoteUrl: string): Promise<void> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("configure_remote_url_cmd", { repoPath, remoteUrl });
  } else {
    console.log(`[Web模式] 模拟配置远程源: ${repoPath} -> ${remoteUrl}`);
  }
}

export async function batchLoadLocalRepos(targetPath: string): Promise<RepoHealth[]> {
  if (isTauriEnv()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<RepoHealth[]>("batch_load_local_repos_cmd", { targetPath });
  }
  return [];
}

