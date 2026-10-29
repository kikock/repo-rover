import React, { useState, useEffect } from "react";
import {
  RepoHealth,
  GitEnvironmentInfo,
  RepoDetailInfo,
  getGitEnvironment,
  setGitConfig,
  startScan,
  openInExplorer,
  openInTerminal,
  openInBrowser,
  getRepoDetails,
  executeGitAction,
  inspectSingleRepo,
  deletePhysicalRepo,
  getGitignoreContent,
  saveGitignoreContent,
  addToGitignore,
  ignoreFileDeep,
  discardSingleFile,
  pickFolder,
  cloneRemoteRepo,
  configureRemoteUrl,
  batchLoadLocalRepos,
  isTauriEnv
} from "./services/api";
import logoImg from "./assets/logo.png";

const CACHE_STORAGE_KEY = "reporover_cached_repos_v2";
const CLONE_BASE_STORAGE_KEY = "reporover_default_clone_base_dir";

interface ConfirmModalConfig {
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

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "repos" | "git-env" | "settings">("dashboard");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  
  // 核心资产列表
  const [repos, setRepos] = useState<RepoHealth[]>([]);
  const [gitEnv, setGitEnv] = useState<GitEnvironmentInfo | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentScanningPath, setCurrentScanningPath] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "dirty" | "unpushed" | "clean">("all");
  
  // 弹窗状态：选中的仓库详情与 Git 运维
  const [selectedRepo, setSelectedRepo] = useState<RepoHealth | null>(null);
  const [repoDetails, setRepoDetails] = useState<RepoDetailInfo | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [gitActionRunning, setGitActionRunning] = useState(false);
  const [consoleLog, setConsoleLog] = useState<string | null>(null);

  // 🌟 自研 Fluent 质感确认弹窗状态（彻底替换原生 prompt 和 confirm）
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {}
  });
  const [confirmInputVal, setConfirmInputVal] = useState("");

  // 🙈 .gitignore 管理面板状态
  const [isGitignoreOpen, setIsGitignoreOpen] = useState(false);
  const [gitignoreContent, setGitignoreContent] = useState("");
  const [loadingGitignore, setLoadingGitignore] = useState(false);
  const [savingGitignore, setSavingGitignore] = useState(false);

  // 弹窗状态：添加仓库对话框 (本地加载、克隆拉取、拉取配置)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState<"local" | "clone" | "config">("local");
  const [manualPathInput, setManualPathInput] = useState("");
  const [addingRepo, setAddingRepo] = useState(false);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [isPickingFolder, setIsPickingFolder] = useState(false);

  // ⬇️ 远程克隆相关状态
  const [defaultCloneBaseDir, setDefaultCloneBaseDir] = useState<string>(() => {
    return localStorage.getItem(CLONE_BASE_STORAGE_KEY) || "D:\\code";
  });
  const [cloneUrlInput, setCloneUrlInput] = useState("");
  const [cloneTargetDirInput, setCloneTargetDirInput] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const [cloneLog, setCloneLog] = useState<string | null>(null);

  // 🔗 仓库详情中远程拉取地址修改状态
  const [isEditingRemoteUrl, setIsEditingRemoteUrl] = useState(false);
  const [remoteUrlEditVal, setRemoteUrlEditVal] = useState("");
  const [isSavingRemoteUrl, setIsSavingRemoteUrl] = useState(false);

  // 📦 批量选择与批量删除管理状态
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);

  // 表单状态
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editAutoCrlf, setEditAutoCrlf] = useState("true");
  const [scanRoots, setScanRoots] = useState<string>("D:\\code\nC:\\Users\\ck");
  const [customExcludes, setCustomExcludes] = useState<string>("node_modules\ntarget\n.next\nAppData\n.gemini\nhistory");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // 初始化加载环境信息与本地持久化缓存
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    loadEnv();

    // ⚡ 二次打开核心能力：优先直接恢复上次扫描到的全部仓库资产，秒开免重复全盘扫描
    const cached = localStorage.getItem(CACHE_STORAGE_KEY);
    if (cached) {
      try {
        const parsed: RepoHealth[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRepos(parsed);
          // 在后台轻量静默异步刷新这批仓库的最新健康状态，不影响即时显示
          refreshCachedReposHealth(parsed);
        }
      } catch (e) {
        console.warn("恢复本地缓存失败", e);
      }
    }
  }, [theme]);

  // 同步更新 repos 并写入持久化存储
  const updateReposWithStorage = (updater: (prev: RepoHealth[]) => RepoHealth[]) => {
    setRepos((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  // 后台静默刷新缓存仓库的健康度
  const refreshCachedReposHealth = async (cachedList: RepoHealth[]) => {
    if (!isTauriEnv()) return;
    for (const item of cachedList) {
      try {
        const fresh = await inspectSingleRepo(item.path);
        updateReposWithStorage((prev) =>
          prev.map((r) => (r.path === item.path ? fresh : r))
        );
      } catch (_) {}
    }
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3200);
  };

  const loadEnv = async () => {
    try {
      const env = await getGitEnvironment();
      setGitEnv(env);
      if (env.global_configs) {
        setEditUserName(env.global_configs["user.name"] || "");
        setEditUserEmail(env.global_configs["user.email"] || "");
        setEditAutoCrlf(env.global_configs["core.autocrlf"] || "true");
      }
    } catch (e) {
      console.error("加载 Git 环境信息失败", e);
    }
  };

  // 触发全盘增量扫描
  const handleTriggerScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setCurrentScanningPath("正在初始化多线程剪枝遍历引擎...");

    const roots = scanRoots
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const excludes = customExcludes
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      await startScan(
        { root_paths: roots, custom_exclusions: excludes },
        (newRepo) => {
          updateReposWithStorage((prev) => {
            const idx = prev.findIndex((r) => r.path === newRepo.path);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = newRepo;
              return updated;
            }
            return [...prev, newRepo];
          });
        },
        (dir) => {
          setCurrentScanningPath(dir);
        }
      );
      showNotice("🎉 全盘仓库探针扫描完成，资产已自动持久化保存！");
    } catch (e: any) {
      showNotice(`扫描过程中出现异常: ${e.message || e}`);
    } finally {
      setIsScanning(false);
      setCurrentScanningPath("");
    }
  };

  // 📂 调用系统原生弹窗拾取本地文件夹 (加载本地仓库)
  const handlePickFolderForLocal = async () => {
    setIsPickingFolder(true);
    try {
      const picked = await pickFolder("选择本地 Git 仓库或包含多个子项目的根目录");
      if (picked) {
        setManualPathInput(picked);
      }
    } catch (err: any) {
      showNotice(`选择目录失败: ${err.message || err}`);
    } finally {
      setIsPickingFolder(false);
    }
  };

  // 📂 调用系统原生弹窗拾取克隆存放目录
  const handlePickFolderForClone = async () => {
    setIsPickingFolder(true);
    try {
      const picked = await pickFolder("选择克隆项目的存放目标目录");
      if (picked) {
        setCloneTargetDirInput(picked);
      }
    } catch (err: any) {
      showNotice(`选择目录失败: ${err.message || err}`);
    } finally {
      setIsPickingFolder(false);
    }
  };

  // ⚙️ 调用系统原生弹窗配置全局默认克隆基准目录
  const handlePickDefaultCloneBase = async () => {
    setIsPickingFolder(true);
    try {
      const picked = await pickFolder("设置拉取代码的全局默认基准根目录");
      if (picked) {
        setDefaultCloneBaseDir(picked);
        localStorage.setItem(CLONE_BASE_STORAGE_KEY, picked);
        showNotice(`已将默认拉取基准根目录设置为: ${picked}`);
        // 如果当前克隆输入框中已有仓库名，联动更新目标路径
        if (cloneUrlInput.trim()) {
          const repoNameMatch = cloneUrlInput.trim().match(/\/([^/]+?)(?:\.git)?$/);
          if (repoNameMatch && repoNameMatch[1]) {
            setCloneTargetDirInput(`${picked}\\${repoNameMatch[1]}`);
          }
        }
      }
    } catch (err: any) {
      showNotice(`设置目录失败: ${err.message || err}`);
    } finally {
      setIsPickingFolder(false);
    }
  };

  // 智能解析远程 URL 提炼仓库名并拼接默认本地存储路径
  const handleCloneUrlChange = (val: string) => {
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

  // 🚀 执行远程仓库克隆 (Git Clone)
  const handleStartCloneRepo = async () => {
    const url = cloneUrlInput.trim();
    const targetDir = cloneTargetDirInput.trim().replace(/^["']|["']$/g, "");
    if (!url) {
      showNotice("请输入远程 Git 仓库地址 (HTTPS 或 SSH)");
      return;
    }
    if (!targetDir) {
      showNotice("请指定项目本地存储目标目录");
      return;
    }

    setIsCloning(true);
    setCloneLog("正在连接远程仓库并拉取数据，请稍候...\n执行指令: git clone --progress " + url + " " + targetDir);
    try {
      const resultLog = await cloneRemoteRepo(url, targetDir);
      setCloneLog(resultLog);

      // 克隆成功后，立即巡检该仓库并纳管
      const health = await inspectSingleRepo(targetDir);
      if (health && health.name) {
        updateReposWithStorage((prev) => {
          if (prev.some((r) => r.path.toLowerCase() === health.path.toLowerCase())) {
            return prev;
          }
          return [health, ...prev];
        });
        showNotice(`🎉 成功拉取远程仓库 [${health.name}] 并纳入资产库！`);
      } else {
        showNotice("✅ 仓库已克隆完毕，可直接在资产库中管理");
      }

      setCloneUrlInput("");
      setCloneTargetDirInput("");
      setCloneLog(null);
      setIsAddModalOpen(false);
    } catch (err: any) {
      const errDetail = err.message || err;
      setCloneLog(`拉取失败: ${errDetail}`);
      showNotice(`克隆拉取失败: ${errDetail}`);
    } finally {
      setIsCloning(false);
    }
  };

  // 📂 加载本地仓库（单仓库直载 或 包含多个子仓库的父目录批量智能载入）
  const handleLoadLocalRepo = async (forceBatch = false) => {
    const rawPath = manualPathInput.trim().replace(/^["']|["']$/g, "");
    if (!rawPath) {
      showNotice("请输入或选择有效的文件夹物理路径");
      return;
    }

    setAddingRepo(true);
    try {
      // 1. 如果强制批量，或非强制情况下优先探测是否为单仓库
      if (!forceBatch) {
        try {
          const health = await inspectSingleRepo(rawPath);
          if (health && health.name) {
            updateReposWithStorage((prev) => {
              if (prev.some((r) => r.path.toLowerCase() === health.path.toLowerCase())) {
                return prev;
              }
              return [health, ...prev];
            });
            showNotice(`✅ 已成功将仓库 [${health.name}] 纳入代码资产管理库！`);
            setManualPathInput("");
            setIsAddModalOpen(false);
            return;
          }
        } catch (_) {
          // 该路径可能不是单个 Git 仓库，自动回退到批量子目录扫描
        }
      }

      // 2. 批量扫描直接子目录中的所有 Git 仓库
      setIsBatchLoading(true);
      const batchList = await batchLoadLocalRepos(rawPath);
      if (batchList && batchList.length > 0) {
        let addedCount = 0;
        updateReposWithStorage((prev) => {
          const existingMap = new Set(prev.map((r) => r.path.toLowerCase()));
          const news = batchList.filter((b) => !existingMap.has(b.path.toLowerCase()));
          addedCount = news.length;
          return [...news, ...prev];
        });
        showNotice(`🎉 智能批量载入完成！在目录下发现并新增了 ${addedCount} 个 Git 仓库`);
        setManualPathInput("");
        setIsAddModalOpen(false);
      } else {
        showNotice("未在该目录下检测到任何 Git 仓库（需包含 .git 目录）");
      }
    } catch (err: any) {
      showNotice(`加载失败: ${err.message || "无法访问指定路径"}`);
    } finally {
      setAddingRepo(false);
      setIsBatchLoading(false);
    }
  };

  // 🔗 保存/配置当前仓库的远程拉取地址 (git remote origin)
  const handleSaveRemoteUrl = async () => {
    if (!selectedRepo) return;
    const newUrl = remoteUrlEditVal.trim();
    if (!newUrl) {
      showNotice("请输入有效的 Git 远程仓库拉取地址");
      return;
    }

    setIsSavingRemoteUrl(true);
    try {
      await configureRemoteUrl(selectedRepo.path, newUrl);
      showNotice(`✅ 成功将远程拉取地址 (origin) 更新为: ${newUrl}`);
      // 刷新详情
      if (repoDetails) {
        setRepoDetails({ ...repoDetails, remote_url: newUrl });
      }
      setSelectedRepo({ ...selectedRepo, remote_url: newUrl });
      setIsEditingRemoteUrl(false);
    } catch (err: any) {
      showNotice(`配置远程地址失败: ${err.message || err}`);
    } finally {
      setIsSavingRemoteUrl(false);
    }
  };

  // 从资产管理库中移除跟踪 (保留磁盘本地物理文件)
  const handleRemoveRepoFromList = (repoPath: string, repoName: string) => {
    setConfirmModal({
      isOpen: true,
      title: "移除仓库资产跟踪",
      icon: "warning",
      description: `确认将【${repoName}】从代码资产管理中心移除吗？`,
      warningNote: "安全提示：此操作仅取消软件跟踪记录，您的本地磁盘物理源码文件将完好保留。",
      confirmText: "确认移除跟踪",
      cancelText: "取消",
      onConfirm: () => {
        updateReposWithStorage((prev) => prev.filter((r) => r.path !== repoPath));
        if (selectedRepo?.path === repoPath) {
          setSelectedRepo(null);
        }
        showNotice(`🗑️ 已将 [${repoName}] 从资产清单移除`);
        setConfirmModal((m) => ({ ...m, isOpen: false }));
      }
    });
  };

  // 判定是否属于内部历史缓存仓库 (如 .gemini\history, AppData, Temp 等)
  const isJunkHistoryRepo = (repoPath: string) => {
    const p = repoPath.toLowerCase();
    return (
      p.includes("\\.gemini\\history") ||
      p.includes("/.gemini/history") ||
      p.includes("\\.gemini\\") ||
      p.includes("/.gemini/") ||
      p.includes("\\appdata\\local\\temp") ||
      p.includes("/temp/")
    );
  };

  // 一键勾选所有历史缓存仓库
  const handleSelectAllJunkRepos = () => {
    const junkPaths = repos.filter((r) => isJunkHistoryRepo(r.path)).map((r) => r.path);
    setSelectedPaths(junkPaths);
    setIsBatchMode(true);
    showNotice(`🧹 已自动勾选 ${junkPaths.length} 个历史临时 Git 仓库`);
  };

  // 切换单个勾选
  const toggleSelectRepo = (path: string) => {
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  // 批量从资产库中移除跟踪
  const handleBatchRemoveConfirm = () => {
    if (selectedPaths.length === 0) return;
    const count = selectedPaths.length;
    setConfirmModal({
      isOpen: true,
      title: "批量移除仓库资产跟踪",
      icon: "warning",
      description: `确认将已选中的 ${count} 个仓库从代码资产管理库中批量移除吗？`,
      warningNote: "安全提示：此操作仅取消软件跟踪记录，您的本地磁盘物理源码文件将完好保留。",
      confirmText: `确认批量移除 (${count} 项)`,
      cancelText: "取消",
      onConfirm: () => {
        const pathSet = new Set(selectedPaths);
        updateReposWithStorage((prev) => prev.filter((r) => !pathSet.has(r.path)));
        if (selectedRepo && pathSet.has(selectedRepo.path)) {
          setSelectedRepo(null);
        }
        setSelectedPaths([]);
        setIsBatchMode(false);
        showNotice(`🗑️ 已成功批量移除 ${count} 个仓库资产跟踪`);
        setConfirmModal((m) => ({ ...m, isOpen: false }));
      }
    });
  };

  // 彻底删除本地物理文件夹 (危险操作)
  const handleDeletePhysicalRepoConfirm = (repoPath: string, repoName: string) => {
    setConfirmInputVal("");
    setConfirmModal({
      isOpen: true,
      title: "彻底删除本地物理文件夹",
      icon: "critical",
      description: `您正在申请从磁盘彻底销毁以下本地物理目录：\n${repoPath}`,
      warningNote: "⚠️ 极高危操作：此操作将永久抹除所有本地未提交或已提交代码且不可撤销！如确认删除，请在下方输入项目名以验证：",
      confirmText: "彻底销毁物理目录",
      cancelText: "取消",
      isCriticalInput: true,
      targetVerifyText: repoName,
      onConfirm: async () => {
        try {
          await deletePhysicalRepo(repoPath);
          updateReposWithStorage((prev) => prev.filter((r) => r.path !== repoPath));
          setSelectedRepo(null);
          showNotice(`🔥 已彻底删除本地物理文件夹: ${repoName}`);
          setConfirmModal((m) => ({ ...m, isOpen: false }));
        } catch (err: any) {
          showNotice(`删除失败: ${err.message || err}`);
        }
      }
    });
  };

  // 展开或收起 .gitignore 编辑面板
  const handleToggleGitignore = async () => {
    if (!selectedRepo) return;
    if (!isGitignoreOpen) {
      setLoadingGitignore(true);
      try {
        const content = await getGitignoreContent(selectedRepo.path);
        setGitignoreContent(content);
        setIsGitignoreOpen(true);
      } catch (err: any) {
        showNotice(`读取 .gitignore 失败: ${err.message || err}`);
      } finally {
        setLoadingGitignore(false);
      }
    } else {
      setIsGitignoreOpen(false);
    }
  };

  // 保存 .gitignore 编辑内容并自动刷新
  const handleSaveGitignore = async () => {
    if (!selectedRepo) return;
    setSavingGitignore(true);
    try {
      await saveGitignoreContent(selectedRepo.path, gitignoreContent);
      showNotice("💾 .gitignore 规则保存成功！已自动重新分析工作区状态");
      await refreshCurrentRepo(selectedRepo.path);
    } catch (err: any) {
      showNotice(`保存失败: ${err.message || err}`);
    } finally {
      setSavingGitignore(false);
    }
  };

  // 一键追加单条忽略规则并自动刷新
  const handleQuickAddGitignore = async (rule: string) => {
    if (!selectedRepo) return;
    try {
      await addToGitignore(selectedRepo.path, rule);
      showNotice(`🙈 已成功将规则 [${rule}] 写入 .gitignore，工作区已自动刷新！`);
      setConsoleLog(`[Git 忽略规则更新]\n✅ 已成功将 "${rule}" 追加至当前仓库 .gitignore\n🔄 正在重新分析工作区索引树与变动文件...`);
      if (isGitignoreOpen) {
        const updated = await getGitignoreContent(selectedRepo.path);
        setGitignoreContent(updated);
      }
      await refreshCurrentRepo(selectedRepo.path);
      setConsoleLog(`[Git 忽略规则更新]\n✅ 规则 "${rule}" 已生效！\n🟢 工作区变动索引已刷新完成`);
    } catch (err: any) {
      showNotice(`追加规则失败: ${err.message || err}`);
      setConsoleLog(`[Git 忽略异常]\n❌ ${err.message || err}`);
    }
  };

  // 针对已跟踪文件的深度忽略（彻底解决单纯加 gitignore 无效的问题）
  const handleDeepIgnore = async (filePath: string, isTracked: boolean) => {
    if (!selectedRepo) return;
    try {
      await ignoreFileDeep(selectedRepo.path, filePath, isTracked);
      showNotice(`🙈 已成功忽略 [${filePath}] 并压制跟踪，工作区已自动刷新！`);
      setConsoleLog(`[Git 深度忽略]\n✅ 已为 "${filePath}" 配置忽略规则${isTracked ? "，并执行 git update-index --assume-unchanged 深度压制跟踪状态" : ""}\n🟢 工作区变动索引已刷新完成`);
      if (isGitignoreOpen) {
        const updated = await getGitignoreContent(selectedRepo.path);
        setGitignoreContent(updated);
      }
      await refreshCurrentRepo(selectedRepo.path);
    } catch (err: any) {
      showNotice(`忽略失败: ${err.message || err}`);
    }
  };

  // 单独放弃某个文件的未暂存修改
  const handleDiscardSingleFile = async (filePath: string) => {
    if (!selectedRepo) return;
    try {
      await discardSingleFile(selectedRepo.path, filePath);
      showNotice(`↩️ 已还原文件修改: [${filePath}]`);
      setConsoleLog(`[Git 还原文件]\n✅ 已恢复 "${filePath}" 至最新版本库原始内容`);
      await refreshCurrentRepo(selectedRepo.path);
    } catch (err: any) {
      showNotice(`还原失败: ${err.message || err}`);
    }
  };

  // 打开某个仓库的详情与 Git 操作面板
  const handleOpenRepoModal = async (repo: RepoHealth) => {
    setSelectedRepo(repo);
    setConsoleLog(null);
    setIsGitignoreOpen(false);
    setLoadingDetails(true);
    try {
      const details = await getRepoDetails(repo.path);
      setRepoDetails(details);
    } catch (err: any) {
      setConsoleLog(`获取仓库详情失败: ${err.message || err}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  // 刷新当前选中的仓库健康状态
  const refreshCurrentRepo = async (repoPath: string) => {
    try {
      const updatedHealth = await inspectSingleRepo(repoPath);
      setSelectedRepo(updatedHealth);
      updateReposWithStorage((prev) =>
        prev.map((r) => (r.path === repoPath ? updatedHealth : r))
      );
      const details = await getRepoDetails(repoPath);
      setRepoDetails(details);
    } catch (_) {}
  };

  // 执行具体的 Git 动作
  const handleRunGitAction = async (action: string, actionName: string) => {
    if (!selectedRepo || gitActionRunning) return;
    setGitActionRunning(true);
    setConsoleLog(`> 正在执行 git ${action}...`);

    try {
      const output = await executeGitAction(selectedRepo.path, action);
      setConsoleLog(`[git ${action} 执行完毕]\n${output}`);
      showNotice(`✅ ${selectedRepo.name} ${actionName} 成功`);
      await refreshCurrentRepo(selectedRepo.path);
    } catch (err: any) {
      setConsoleLog(`[git ${action} 异常失败]\n${err.message || err}`);
      showNotice(`❌ 执行失败: ${err.message || err}`);
    } finally {
      setGitActionRunning(false);
    }
  };

  // 保存 Git 全局配置
  const handleSaveGitConfig = async () => {
    try {
      if (editUserName) await setGitConfig("user.name", editUserName);
      if (editUserEmail) await setGitConfig("user.email", editUserEmail);
      if (editAutoCrlf) await setGitConfig("core.autocrlf", editAutoCrlf);
      showNotice("✅ 全局 Git 配置保存成功！");
      await loadEnv();
    } catch (e: any) {
      showNotice(`保存失败: ${e.message || e}`);
    }
  };

  // 导出资产清单
  const handleExportMarkdown = () => {
    if (repos.length === 0) {
      showNotice("当前没有已发现的仓库可供导出");
      return;
    }
    let md = `# 本地 Git 仓库资产清单 (Repo Rover 导出)\n\n`;
    md += `> 导出时间：${new Date().toLocaleString()} | 仓库总计：${repos.length} 个\n\n`;
    md += `| 仓库名称 | 分支 | 状态 | 远程源 | 本地物理路径 |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    repos.forEach((r) => {
      const state = r.is_dirty ? "🔴 脏工作区" : r.ahead_count > 0 ? "🟡 未推送" : "🟢 同步纯净";
      md += `| ${r.name} | \`${r.branch}\` | ${state} | ${r.remote_url || "纯本地"} | \`${r.path}\` |\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `git_repositories_asset_${Date.now()}.md`;
    a.click();
    showNotice("📄 Markdown 资产报告导出成功！");
  };

  // 过滤后的仓库列表
  const filteredRepos = repos.filter((r) => {
    const matchQuery =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.branch.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchQuery) return false;
    if (statusFilter === "dirty") return r.is_dirty;
    if (statusFilter === "unpushed") return r.ahead_count > 0;
    if (statusFilter === "clean") return r.is_clean && r.ahead_count === 0;
    return true;
  });

  const dirtyCount = repos.filter((r) => r.is_dirty).length;
  const unpushedCount = repos.filter((r) => r.ahead_count > 0).length;
  const cleanCount = repos.filter((r) => r.is_clean && r.ahead_count === 0).length;

  return (
    <div className="app-container">
      {/* 侧边导航栏 */}
      <aside className="sidebar">
        <div className="brand-header">
          <img src={logoImg} alt="Repo Rover Logo" style={{ width: "36px", height: "36px", borderRadius: "8px", boxShadow: "0 4px 12px var(--accent-glow)" }} />
          <div>
            <div className="brand-title">Repo Rover</div>
            <div className="brand-subtitle">Git 仓库全盘探针</div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          <div
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 主页工作台
          </div>
          <div
            className={`nav-item ${activeTab === "repos" ? "active" : ""}`}
            onClick={() => setActiveTab("repos")}
          >
            📁 本地仓库资产
            {repos.length > 0 && (
              <span style={{ marginLeft: "auto", fontSize: "11px", opacity: 0.8 }}>
                {repos.length}
              </span>
            )}
          </div>
          <div
            className={`nav-item ${activeTab === "git-env" ? "active" : ""}`}
            onClick={() => setActiveTab("git-env")}
          >
            ⚙️ Git 环境与配置
          </div>
          <div
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            🛡️ 扫描与剪枝规则
          </div>
        </nav>

        {/* 底部运行环境模式提示 */}
        <div style={{ padding: "12px 10px", fontSize: "11px", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)" }}>
          <div>已就绪资产：{repos.length} 个项目</div>
          <div style={{ marginTop: "4px" }}>持久化：本地安全缓存</div>
        </div>
      </aside>

      {/* 主视窗 */}
      <main className="main-viewport">
        {/* 顶栏 */}
        <header className="topbar">
          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="快速检索项目名、本地路径、所在分支..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="action-btn-group">
            <button
              className="btn-secondary"
              onClick={() => setIsAddModalOpen(true)}
              title="手动录入指定 Git 仓库路径"
            >
              ➕ 添加仓库
            </button>

            <button
              className="btn-primary"
              onClick={handleTriggerScan}
              disabled={isScanning}
              style={{ opacity: isScanning ? 0.7 : 1 }}
              title="全盘重新扫描探测并自动增量同步"
            >
              {isScanning ? "⏳ 正在并发剪枝扫描..." : "⚡ 启动全盘探针扫描"}
            </button>

            <button
              className="btn-secondary"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="切换 Fluent 浅色 / 深色模式"
            >
              {theme === "dark" ? "☀️ 浅色" : "🌙 深色"}
            </button>
          </div>
        </header>

        {/* 动态内容区 */}
        <section className="content-area">
          {/* 扫描中动画提示 */}
          {isScanning && (
            <div className="scan-banner">
              <div>
                <strong style={{ fontSize: "14px" }}>🚀 正在以多线程工作窃取模式扫描全盘文件系统...</strong>
                <div style={{ fontSize: "12px", color: "var(--text-main)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
                  当前探测：{currentScanningPath || "正在跳过系统缓存与深层垃圾目录..."}
                </div>
              </div>
              <div style={{ fontSize: "16px", fontWeight: "700" }}>
                已发现 {repos.length} 个仓库
              </div>
            </div>
          )}

          {/* 页面 1：主页工作台 */}
          {activeTab === "dashboard" && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">已索引仓库总数 (已持久化)</span>
                  <span className="stat-value" style={{ color: "var(--accent-primary)" }}>{repos.length}</span>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>二次打开秒开，免重复扫描</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">🔴 脏工作区预警 (Dirty)</span>
                  <span className="stat-value" style={{ color: "var(--color-dirty)" }}>{dirtyCount}</span>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>存在未暂存或未提交代码</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">🟡 未推送 Commit (Unpushed)</span>
                  <span className="stat-value" style={{ color: "var(--color-unpushed)" }}>{unpushedCount}</span>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>本地领先于远程追踪源</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">🟢 同步纯净状态 (Clean)</span>
                  <span className="stat-value" style={{ color: "var(--color-clean)" }}>{cleanCount}</span>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>工作区健康且已全部同步</span>
                </div>
              </div>

              {/* 快捷引导卡片 */}
              <div style={{
                background: "var(--bg-card)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                border: "1px solid var(--border-subtle)",
                marginBottom: "24px"
              }}>
                <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>欢迎使用 Repo Rover 代码资产治理中心</h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  已成功构建本地代码资产数据库。<strong>二次打开无需重新扫描，秒开即用！</strong>
                  你可以随时点击右上角「➕ 添加仓库」手动增加项目，或在卡片中直接「移除跟踪」进行资产裁剪。
                </p>
                <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
                  <button className="btn-primary" onClick={() => setActiveTab("repos")}>
                    查看仓库资产看板 ({repos.length})
                  </button>
                  <button className="btn-secondary" onClick={() => setIsAddModalOpen(true)}>
                    ➕ 手动添加仓库
                  </button>
                  <button className="btn-secondary" onClick={handleExportMarkdown}>
                    导出 Markdown 报告
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 页面 2：仓库资产全景看板 */}
          {(activeTab === "repos" || activeTab === "dashboard") && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className={`btn-secondary ${statusFilter === "all" ? "active" : ""}`}
                    onClick={() => setStatusFilter("all")}
                    style={statusFilter === "all" ? { borderColor: "var(--accent-primary)", color: "var(--accent-primary)" } : {}}
                  >
                    全部 ({repos.length})
                  </button>
                  <button
                    className={`btn-secondary ${statusFilter === "dirty" ? "active" : ""}`}
                    onClick={() => setStatusFilter("dirty")}
                    style={statusFilter === "dirty" ? { borderColor: "var(--color-dirty)", color: "var(--color-dirty)" } : {}}
                  >
                    🔴 脏工作区 ({dirtyCount})
                  </button>
                  <button
                    className={`btn-secondary ${statusFilter === "unpushed" ? "active" : ""}`}
                    onClick={() => setStatusFilter("unpushed")}
                    style={statusFilter === "unpushed" ? { borderColor: "var(--color-unpushed)", color: "var(--color-unpushed)" } : {}}
                  >
                    🟡 未推送 ({unpushedCount})
                  </button>
                  <button
                    className={`btn-secondary ${statusFilter === "clean" ? "active" : ""}`}
                    onClick={() => setStatusFilter("clean")}
                    style={statusFilter === "clean" ? { borderColor: "var(--color-clean)", color: "var(--color-clean)" } : {}}
                  >
                    🟢 纯净就绪 ({cleanCount})
                  </button>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {repos.some((r) => isJunkHistoryRepo(r.path)) && (
                    <button
                      className="smart-clean-chip"
                      onClick={handleSelectAllJunkRepos}
                      title="一键识别并勾选所有由 IDE/Agent 生成的无用历史缓存仓库"
                    >
                      🧹 勾选临时缓存 ({repos.filter((r) => isJunkHistoryRepo(r.path)).length})
                    </button>
                  )}
                  <button
                    className={`btn-secondary ${isBatchMode ? "active" : ""}`}
                    onClick={() => {
                      setIsBatchMode(!isBatchMode);
                      if (isBatchMode) setSelectedPaths([]);
                    }}
                    style={isBatchMode ? { borderColor: "var(--accent-primary)", color: "var(--accent-primary)", background: "var(--accent-glow)" } : {}}
                    title="开启多选批量管理模式"
                  >
                    ☑️ 批量管理 {selectedPaths.length > 0 ? `(${selectedPaths.length})` : ""}
                  </button>
                  <button className="btn-secondary" onClick={() => setIsAddModalOpen(true)}>
                    ➕ 添加仓库
                  </button>
                  <button className="btn-secondary" onClick={handleExportMarkdown}>
                    📥 导出清单 (Markdown)
                  </button>
                </div>
              </div>

              {/* 📦 批量选择与批量删除快捷操作工具栏 */}
              {(isBatchMode || selectedPaths.length > 0) && (
                <div className="batch-actions-bar">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-main)" }}>
                      📦 已选 <strong style={{ color: "var(--accent-primary)" }}>{selectedPaths.length}</strong> / {filteredRepos.length} 个项目
                    </span>
                    <button
                      className="btn-secondary"
                      style={{ padding: "3px 10px", fontSize: "11px" }}
                      onClick={() => {
                        const allPaths = filteredRepos.map((r) => r.path);
                        setSelectedPaths(allPaths);
                      }}
                    >
                      全选当前筛选 ({filteredRepos.length})
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ padding: "3px 10px", fontSize: "11px" }}
                      onClick={() => setSelectedPaths([])}
                    >
                      清空勾选
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      className="btn-primary"
                      style={{
                        background: "#d83b01",
                        borderColor: "#d83b01",
                        padding: "5px 14px",
                        fontSize: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                      disabled={selectedPaths.length === 0}
                      onClick={handleBatchRemoveConfirm}
                    >
                      🗑️ 批量移除跟踪 ({selectedPaths.length} 项)
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ padding: "5px 10px", fontSize: "12px" }}
                      onClick={() => {
                        setIsBatchMode(false);
                        setSelectedPaths([]);
                      }}
                    >
                      退出批量
                    </button>
                  </div>
                </div>
              )}

              {filteredRepos.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "60px 0",
                  color: "var(--text-muted)",
                  background: "var(--bg-card)",
                  borderRadius: "var(--radius-md)"
                }}>
                  <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔍</div>
                  <div style={{ fontSize: "15px", fontWeight: "500" }}>暂未发现符合条件的 Git 仓库</div>
                  <div style={{ fontSize: "12.5px", marginTop: "6px" }}>请点击顶栏「启动全盘探针扫描」或「➕ 添加仓库」</div>
                </div>
              ) : (
                <div className="repo-card-grid">
                  {filteredRepos.map((repo) => {
                    const isSelected = selectedPaths.includes(repo.path);
                    return (
                      <div
                        key={repo.path}
                        className={`repo-card ${isSelected ? "batch-selected" : ""}`}
                        style={{ cursor: "pointer", position: "relative" }}
                        onClick={() => {
                          if (isBatchMode) {
                            toggleSelectRepo(repo.path);
                          } else {
                            handleOpenRepoModal(repo);
                          }
                        }}
                        title={isBatchMode ? "点击切换选中状态" : "点击展开该项目的 Git 运维与变更详情控制台"}
                      >
                        <div>
                          <div className="repo-header">
                            <div className="repo-name" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <input
                                type="checkbox"
                                className="batch-card-checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectRepo(repo.path)}
                                onClick={(e) => e.stopPropagation()}
                                title="勾选/取消勾选以批量管理"
                              />
                              <span>📦</span>
                              <span style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {repo.name}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {repo.is_dirty ? (
                                <span className="status-badge dirty">🔴 脏改动 ({repo.unstaged_count + repo.staged_count + repo.untracked_count})</span>
                              ) : repo.ahead_count > 0 ? (
                                <span className="status-badge unpushed">🟡 领先 {repo.ahead_count} 提交</span>
                              ) : (
                                <span className="status-badge clean">🟢 干净</span>
                              )}
                            </div>
                          </div>

                          <div className="repo-path" title={repo.path}>
                            {repo.path}
                          </div>
                        </div>

                      <div className="repo-meta">
                        <div className="repo-meta-row">
                          <span>当前主分支：</span>
                          <strong style={{ color: "var(--accent-primary)" }}>🌿 {repo.branch}</strong>
                        </div>
                        <div className="repo-meta-row">
                          <span>托管平台：</span>
                          <span>{repo.remote_provider || "纯本地孤岛仓库"}</span>
                        </div>
                        {repo.last_commit_time && (
                          <div className="repo-meta-row">
                            <span>最后提交：</span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{repo.last_commit_time}</span>
                          </div>
                        )}
                        {repo.last_commit_msg && (
                          <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            💬 {repo.last_commit_msg}
                          </div>
                        )}
                      </div>

                      {/* 交互操作栏 (已去掉 VS Code 与 Cursor，增加删除/移除操作) */}
                      <div className="repo-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn-icon-action"
                          onClick={() => openInTerminal(repo.path)}
                          title="在当前目录启动终端"
                        >
                          📟 终端
                        </button>
                        <button
                          className="btn-icon-action"
                          onClick={() => openInExplorer(repo.path)}
                          title="在文件资源管理器中打开"
                        >
                          📂 目录
                        </button>
                        {repo.remote_url && (
                          <button
                            className="btn-icon-action"
                            onClick={() => openInBrowser(repo.remote_url!)}
                            title="在浏览器中打开远程主页"
                          >
                            🌐 远程
                          </button>
                        )}
                        <button
                          className="btn-icon-action"
                          onClick={() => handleRemoveRepoFromList(repo.path, repo.name)}
                          title="从资产列表中移除跟踪（保留本地磁盘文件）"
                          style={{ color: "var(--text-muted)" }}
                        >
                          ❌ 移除
                        </button>
                        <button
                          className="btn-icon-action"
                          style={{ marginLeft: "auto", background: "var(--accent-glow)", color: "var(--accent-primary)", borderColor: "var(--accent-primary)" }}
                          onClick={() => handleOpenRepoModal(repo)}
                          title="进入 Git 专属运维面板"
                        >
                          ⚙️ Git 操作
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          )}

          {/* 页面 3：Git 环境与配置 */}
          {activeTab === "git-env" && (
            <div style={{ maxWidth: "800px" }}>
              <div style={{
                background: "var(--bg-card)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                border: "1px solid var(--border-subtle)",
                marginBottom: "20px"
              }}>
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
              <div style={{
                background: "var(--bg-card)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                border: "1px solid var(--border-subtle)",
                marginBottom: "20px"
              }}>
                <h3 style={{ fontSize: "16px", marginBottom: "14px" }}>⚙️ 全局配置托管 (git config --global)</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", marginBottom: "6px" }}>用户全名 (user.name)</label>
                    <input
                      type="text"
                      className="search-box"
                      style={{ width: "100%", background: "rgba(0,0,0,0.2)" }}
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", marginBottom: "6px" }}>用户邮箱 (user.email)</label>
                    <input
                      type="email"
                      className="search-box"
                      style={{ width: "100%", background: "rgba(0,0,0,0.2)" }}
                      value={editUserEmail}
                      onChange={(e) => setEditUserEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", marginBottom: "6px" }}>Windows 换行符策略 (core.autocrlf)</label>
                    <select
                      value={editAutoCrlf}
                      onChange={(e) => setEditAutoCrlf(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-main)",
                        outline: "none"
                      }}
                    >
                      <option value="true">true (Windows 推荐：检出时转 CRLF，提交时转 LF)</option>
                      <option value="input">input (提交时转 LF，检出时不转换)</option>
                      <option value="false">false (不做任何换行符转换)</option>
                    </select>
                  </div>

                  <button className="btn-primary" style={{ width: "fit-content" }} onClick={handleSaveGitConfig}>
                    💾 写入并应用全局配置
                  </button>
                </div>
              </div>

              {/* SSH 密钥管理 */}
              <div style={{
                background: "var(--bg-card)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                border: "1px solid var(--border-subtle)"
              }}>
                <h3 style={{ fontSize: "16px", marginBottom: "14px" }}>🔑 SSH 密钥与公钥一览</h3>
                {gitEnv?.ssh_keys && gitEnv.ssh_keys.length > 0 ? (
                  <div>
                    {gitEnv.ssh_keys.map((k) => (
                      <div key={k.name} style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "var(--radius-sm)", marginBottom: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <strong style={{ fontSize: "13px" }}>{k.name}</strong>
                          <button
                            className="btn-secondary"
                            onClick={() => {
                              navigator.clipboard.writeText(k.public_key_content);
                              showNotice("📋 公钥已成功复制到系统剪贴板！");
                            }}
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
          )}

          {/* 页面 4：扫描与剪枝规则设置 */}
          {activeTab === "settings" && (
            <div style={{ maxWidth: "800px" }}>
              <div style={{
                background: "var(--bg-card)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                border: "1px solid var(--border-subtle)",
                marginBottom: "20px"
              }}>
                <h3 style={{ fontSize: "16px", marginBottom: "14px" }}>🛡️ 扫描根路径配置 (按行分割)</h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  指定扫描程序需要遍历的磁盘盘符或开发目录。
                </p>
                <textarea
                  rows={4}
                  value={scanRoots}
                  onChange={(e) => setScanRoots(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-main)",
                    padding: "10px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12.5px"
                  }}
                />
              </div>

              <div style={{
                background: "var(--bg-card)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                border: "1px solid var(--border-subtle)"
              }}>
                <h3 style={{ fontSize: "16px", marginBottom: "14px" }}>✂️ 深度剪枝忽略黑名单 (遇到即停止递归)</h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  关键性能防线：遍历文件系统时，一旦命中以下目录名将立即终止深入，避免消耗大量 I/O：
                </p>
                <textarea
                  rows={5}
                  value={customExcludes}
                  onChange={(e) => setCustomExcludes(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-main)",
                    padding: "10px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12.5px"
                  }}
                />
                <div style={{ marginTop: "12px" }}>
                  <button className="btn-primary" onClick={() => showNotice("规则已更新保存！")}>
                    保存剪枝规则
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ➕ 添加与拉取仓库多功能弹窗对话框 */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-container" style={{ width: "640px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📦</span> 代码仓库接入与拉取中心
              </h3>
              <button
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "18px", cursor: "pointer" }}
                onClick={() => setIsAddModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ gap: "16px" }}>
              {/* 选项卡导航 */}
              <div className="modal-nav-tabs">
                <button
                  className={`modal-nav-tab ${addModalTab === "local" ? "active" : ""}`}
                  onClick={() => setAddModalTab("local")}
                >
                  📂 加载本地仓库
                </button>
                <button
                  className={`modal-nav-tab ${addModalTab === "clone" ? "active" : ""}`}
                  onClick={() => setAddModalTab("clone")}
                >
                  ⬇️ 远程克隆拉取
                </button>
                <button
                  className={`modal-nav-tab ${addModalTab === "config" ? "active" : ""}`}
                  onClick={() => setAddModalTab("config")}
                >
                  ⚙️ 拉取基准目录
                </button>
              </div>

              {/* 选项卡 1：加载本地仓库 */}
              {addModalTab === "local" && (
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
                      onClick={handlePickFolderForLocal}
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
                    <button className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                      取消
                    </button>
                    <button
                      className="btn-secondary"
                      disabled={addingRepo || isBatchLoading}
                      onClick={() => handleLoadLocalRepo(true)}
                      style={{ border: "1px solid var(--accent-primary)", color: "var(--accent-primary)" }}
                    >
                      {isBatchLoading ? "正在批量探测..." : "📦 批量载入子仓库"}
                    </button>
                    <button
                      className="btn-primary"
                      disabled={addingRepo || isBatchLoading}
                      onClick={() => handleLoadLocalRepo(false)}
                    >
                      {addingRepo ? "正在验证仓库..." : "✨ 智能识别载入"}
                    </button>
                  </div>
                </div>
              )}

              {/* 选项卡 2：远程克隆拉取 */}
              {addModalTab === "clone" && (
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
                      onChange={(e) => handleCloneUrlChange(e.target.value)}
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
                        onClick={handlePickFolderForClone}
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
                      <div className="clone-console-box">
                        {cloneLog}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                    <button className="btn-secondary" disabled={isCloning} onClick={() => setIsAddModalOpen(false)}>
                      取消
                    </button>
                    <button
                      className="btn-primary"
                      disabled={isCloning}
                      onClick={handleStartCloneRepo}
                    >
                      {isCloning ? "正在拉取代码中..." : "⚡ 开始克隆并纳管"}
                    </button>
                  </div>
                </div>
              )}

              {/* 选项卡 3：默认拉取基准目录配置 */}
              {addModalTab === "config" && (
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
                        onChange={(e) => {
                          setDefaultCloneBaseDir(e.target.value);
                          localStorage.setItem(CLONE_BASE_STORAGE_KEY, e.target.value);
                        }}
                      />
                      <button
                        className="btn-secondary"
                        disabled={isPickingFolder}
                        onClick={handlePickDefaultCloneBase}
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
                    <button className="btn-primary" onClick={() => {
                      showNotice("基准目录配置已生效！");
                      setAddModalTab("clone");
                    }}>
                      返回克隆面板
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🚀 项目专属 Git 交互控制台与变动文件弹窗 (Modal) */}
      {selectedRepo && (
        <div className="modal-backdrop" onClick={() => setSelectedRepo(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            {/* 弹窗顶栏 */}
            <div className="modal-header">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>📦</span>
                  <h2 style={{ fontSize: "18px", fontWeight: "700" }}>{selectedRepo.name}</h2>
                  <div>
                    {selectedRepo.is_dirty ? (
                      <span className="status-badge dirty">🔴 脏工作区 ({selectedRepo.unstaged_count + selectedRepo.staged_count + selectedRepo.untracked_count} 个变动)</span>
                    ) : selectedRepo.ahead_count > 0 ? (
                      <span className="status-badge unpushed">🟡 未推送 ({selectedRepo.ahead_count} 提交)</span>
                    ) : (
                      <span className="status-badge clean">🟢 同步纯净</span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: "6px" }}>
                  {selectedRepo.path}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", fontSize: "11.5px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>远程拉取源 (origin):</span>
                  <code style={{ color: "var(--accent-primary)", background: "rgba(0,120,212,0.1)", padding: "1px 6px", borderRadius: "3px" }}>
                    {selectedRepo.remote_url || repoDetails?.remote_url || "未配置远程地址"}
                  </code>
                  <button
                    className="btn-secondary"
                    style={{ padding: "2px 8px", fontSize: "11px" }}
                    onClick={() => {
                      setRemoteUrlEditVal(selectedRepo.remote_url || repoDetails?.remote_url || "");
                      setIsEditingRemoteUrl(!isEditingRemoteUrl);
                    }}
                  >
                    🔗 配置拉取地址
                  </button>
                </div>
                {isEditingRemoteUrl && (
                  <div style={{ marginTop: "8px", display: "flex", gap: "6px", alignItems: "center" }}>
                    <input
                      type="text"
                      className="search-box"
                      style={{ fontSize: "12px", padding: "4px 8px", width: "360px", fontFamily: "var(--font-mono)" }}
                      placeholder="例如: https://github.com/username/project.git"
                      value={remoteUrlEditVal}
                      onChange={(e) => setRemoteUrlEditVal(e.target.value)}
                    />
                    <button
                      className="btn-primary"
                      style={{ padding: "4px 10px", fontSize: "12px" }}
                      disabled={isSavingRemoteUrl}
                      onClick={handleSaveRemoteUrl}
                    >
                      {isSavingRemoteUrl ? "保存中..." : "保存"}
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "12px" }}
                      onClick={() => setIsEditingRemoteUrl(false)}
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  className="btn-secondary"
                  style={{ padding: "4px 10px", fontSize: "11.5px", color: "var(--color-dirty)" }}
                  onClick={() => handleRemoveRepoFromList(selectedRepo.path, selectedRepo.name)}
                  title="仅从当前资产列表中移除跟踪（安全保留物理文件）"
                >
                  ❌ 移除跟踪
                </button>
                <button
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                    fontSize: "20px",
                    cursor: "pointer",
                    padding: "4px 8px"
                  }}
                  onClick={() => setSelectedRepo(null)}
                  title="关闭"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 弹窗内容区 */}
            <div className="modal-body">
              {/* Git 核心动作工具栏 */}
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "var(--text-secondary)" }}>
                  ⚡ Git 常用操作面板
                </div>
                <div className="git-action-toolbar">
                  <button
                    className="btn-git-action"
                    disabled={gitActionRunning}
                    onClick={() => handleRunGitAction("pull", "Pull 拉取最新代码")}
                  >
                    ⬇️ Git Pull (拉取)
                  </button>
                  <button
                    className="btn-git-action"
                    disabled={gitActionRunning}
                    onClick={() => handleRunGitAction("push", "Push 推送本地提交")}
                  >
                    ⬆️ Git Push (推送)
                  </button>
                  <button
                    className="btn-git-action"
                    disabled={gitActionRunning}
                    onClick={() => handleRunGitAction("fetch", "Fetch 同步远程索引")}
                  >
                    🔄 Git Fetch (同步)
                  </button>
                  <button
                    className="btn-git-action"
                    disabled={gitActionRunning}
                    onClick={() => handleRunGitAction("stash", "一键暂存工作现场")}
                  >
                    📦 Stash (暂存现场)
                  </button>
                  <button
                    className="btn-git-action"
                    disabled={gitActionRunning}
                    onClick={() => handleRunGitAction("stash_pop", "恢复上次暂存现场")}
                  >
                    📥 Stash Pop (恢复现场)
                  </button>
                  <button
                    className="btn-git-action"
                    disabled={gitActionRunning}
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: "放弃工作区未暂存修改",
                        icon: "warning",
                        description: `确认放弃仓库【${selectedRepo.name}】中所有已变动但未暂存的本地代码吗？`,
                        warningNote: "⚠️ 警告：该操作将执行 git checkout . ，所有未暂存代码将永久丢弃且不可撤销！",
                        confirmText: "确认放弃修改",
                        cancelText: "保留修改",
                        onConfirm: () => {
                          handleRunGitAction("discard", "放弃修改现场");
                          setConfirmModal((m) => ({ ...m, isOpen: false }));
                        }
                      });
                    }}
                    style={{ color: "#ff6e4a" }}
                  >
                    🗑️ 放弃工作区修改
                  </button>

                  <div style={{ height: "24px", width: "1px", background: "var(--border-subtle)", margin: "0 4px" }} />

                  <button
                    className="btn-git-action"
                    onClick={() => openInTerminal(selectedRepo.path)}
                  >
                    📟 打开终端
                  </button>
                  <button
                    className="btn-git-action"
                    onClick={() => openInExplorer(selectedRepo.path)}
                  >
                    📂 打开文件夹
                  </button>
                  {selectedRepo.remote_url && (
                    <button
                      className="btn-git-action"
                      onClick={() => openInBrowser(selectedRepo.remote_url!)}
                    >
                      🌐 远程主页
                    </button>
                  )}
                </div>
              </div>

              {/* 控制台实时执行日志 */}
              {consoleLog && (
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    📟 操作执行日志回显：
                  </div>
                  <pre className="console-output-box">{consoleLog}</pre>
                </div>
              )}

              {/* 变动文件清单与 .gitignore 深度协同管理 */}
              <div>
                {(() => {
                  const validChangedFiles = repoDetails?.changed_files.filter(
                    (f) => !f.file_path.endsWith(".gitignore") && !f.file_path.endsWith(".gitattributes")
                  ) || [];
                  return (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
                          📑 工作区修改文件清单 ({validChangedFiles.length})
                        </span>
                    <button
                      className="btn-secondary"
                      style={{
                        padding: "2px 8px",
                        fontSize: "11px",
                        borderColor: isGitignoreOpen ? "var(--accent-primary)" : "var(--border-subtle)",
                        color: isGitignoreOpen ? "var(--accent-primary)" : "var(--text-secondary)",
                        background: isGitignoreOpen ? "var(--accent-glow)" : "transparent"
                      }}
                      onClick={handleToggleGitignore}
                      title="展开/编辑当前仓库的 .gitignore 规则清单"
                    >
                      🙈 {isGitignoreOpen ? "收起 .gitignore" : "查看/编辑 .gitignore"}
                    </button>
                  </div>
                  <button
                    className="btn-secondary"
                    style={{ padding: "3px 10px", fontSize: "11px" }}
                    onClick={() => refreshCurrentRepo(selectedRepo.path)}
                  >
                    刷新状态
                  </button>
                </div>

                {/* .gitignore 管理视窗抽屉 */}
                {isGitignoreOpen && (
                  <div className="gitignore-panel" style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-main)" }}>
                        🙈 .gitignore 忽略规则清单 (位于项目根目录)
                      </span>
                      <button
                        className="btn-primary"
                        style={{ padding: "3px 12px", fontSize: "11.5px" }}
                        disabled={savingGitignore}
                        onClick={handleSaveGitignore}
                      >
                        {savingGitignore ? "正在保存..." : "💾 保存并立即生效"}
                      </button>
                    </div>

                    {/* 常用模板一键快捷追加 */}
                    <div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
                        常用开发忽略模板 (点击直接追加)：
                      </div>
                      <div className="gitignore-tag-chips">
                        {[
                          { label: "IntelliJ/IDE (.idea/)", rule: ".idea/" },
                          { label: "IDEA 模块 (*.iml)", rule: "*.iml" },
                          { label: "VS Code (.vscode/)", rule: ".vscode/" },
                          { label: "Node.js (node_modules/)", rule: "node_modules/" },
                          { label: "Maven/Java (target/)", rule: "target/" },
                          { label: "日志文件 (*.log)", rule: "*.log" },
                          { label: "macOS 缓存 (.DS_Store)", rule: ".DS_Store" },
                          { label: "临时缓存 (*.tmp)", rule: "*.tmp" }
                        ].map((item) => (
                          <span
                            key={item.rule}
                            className="tag-chip"
                            title={`追加 ${item.rule} 到 .gitignore`}
                            onClick={() => {
                              setGitignoreContent((prev) => {
                                if (prev.includes(item.rule)) return prev;
                                return prev.endsWith("\n") || prev.length === 0
                                  ? `${prev}${item.rule}\n`
                                  : `${prev}\n${item.rule}\n`;
                              });
                              showNotice(`已将 [${item.rule}] 填入编辑框，点击“保存并立即生效”应用`);
                            }}
                          >
                            + {item.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {loadingGitignore ? (
                      <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                        正在读取 .gitignore 规则...
                      </div>
                    ) : (
                      <textarea
                        className="gitignore-textarea"
                        value={gitignoreContent}
                        onChange={(e) => setGitignoreContent(e.target.value)}
                        placeholder="# 每行一条忽略规则，例如：&#10;.idea/&#10;*.iml&#10;target/&#10;node_modules/"
                      />
                    )}
                  </div>
                )}

                {loadingDetails ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                    正在分析本地索引树与变动文件...
                  </div>
                ) : validChangedFiles.length > 0 ? (
                  <div className="diff-list-container">
                    {validChangedFiles.map((file, idx) => {
                      // 解析所属子目录规则
                      const normalized = file.file_path.replace(/\\/g, "/");
                      const parts = normalized.split("/");
                      const dirRule = parts.length > 1 ? `${parts[0]}/` : null;
                      
                      // 解析后缀同类扩展名规则
                      const dotIdx = file.file_path.lastIndexOf(".");
                      const ext = dotIdx > 0 && dotIdx < file.file_path.length - 1 ? file.file_path.substring(dotIdx + 1).toLowerCase() : null;
                      const extRule = ext && ["iml", "log", "tmp", "bak", "class", "cache", "lock", "xml"].includes(ext) ? `*.${ext}` : null;

                      return (
                        <div key={idx} className="diff-file-row">
                          <span className={`diff-badge ${file.status === "M" ? "m" : file.status === "A" ? "a" : file.status === "D" ? "d" : "untracked"}`}>
                            {file.status}
                          </span>
                          <span style={{ color: "var(--text-main)", flex: 1, wordBreak: "break-all" }}>{file.file_path}</span>
                          
                          {/* 快捷一键忽略动作组 */}
                          <div className="diff-file-actions">
                            {dirRule && (
                              <button
                                className="btn-diff-action ignore"
                                title={`将所属目录 [${dirRule}] 加入 .gitignore`}
                                onClick={() => handleQuickAddGitignore(dirRule)}
                              >
                                📁 忽略目录
                              </button>
                            )}
                            {extRule && extRule !== "*.xml" && (
                              <button
                                className="btn-diff-action ignore"
                                title={`将文件模式 [${extRule}] 加入 .gitignore`}
                                onClick={() => handleQuickAddGitignore(extRule)}
                              >
                                🏷️ {extRule}
                              </button>
                            )}
                            <button
                              className="btn-diff-action ignore"
                              title={`将具体文件 [${file.file_path}] 加入忽略规则${file.status !== "??" ? "（已跟踪文件将同步执行深度压制使其彻底隐藏）" : ""}`}
                              onClick={() => handleDeepIgnore(file.file_path, file.status !== "??")}
                            >
                              🙈 忽略此文件
                            </button>
                            {file.status !== "??" && (
                              <button
                                className="btn-diff-action"
                                title="放弃此文件所有本地修改，还原到 Git 原始提交状态"
                                onClick={() => handleDiscardSingleFile(file.file_path)}
                              >
                                ↩️ 还原修改
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--color-clean)", background: "rgba(0,0,0,0.15)", borderRadius: "var(--radius-sm)", fontSize: "12px" }}>
                    🟢 工作区纯净，没有检测到任何未提交的代码变动
                  </div>
                )}
                    </>
                  );
                })()}
              </div>

              {/* 最近历史提交 */}
              {repoDetails && repoDetails.recent_commits.length > 0 && (
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "var(--text-secondary)" }}>
                    📜 最近提交历史 (最近 {repoDetails.recent_commits.length} 次)
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "160px", overflowY: "auto" }}>
                    {repoDetails.recent_commits.map((c) => (
                      <div key={c.hash} style={{ background: "rgba(0,0,0,0.15)", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
                        <code style={{ color: "var(--accent-primary)", fontWeight: "600" }}>{c.hash}</code>
                        <span style={{ color: "var(--text-main)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.message}</span>
                        <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{c.author} · {c.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 危险操作区：物理删除 */}
              <div style={{
                marginTop: "10px",
                borderTop: "1px dashed rgba(216, 59, 1, 0.3)",
                paddingTop: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: "600", color: "#ff6e4a" }}>
                    ⚠️ 磁盘物理清理区
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    若该项目已废弃且无需保留任何本地源码，可彻底从磁盘销毁。
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  style={{ color: "#ff6e4a", borderColor: "rgba(216,59,1,0.4)" }}
                  onClick={() => handleDeletePhysicalRepoConfirm(selectedRepo.path, selectedRepo.name)}
                >
                  🔥 彻底删除物理文件夹
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 极致美化：自研 Fluent Design 确认/高危二次校验模态弹窗 */}
      {confirmModal.isOpen && (
        <div
          className="confirm-backdrop"
          onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            className={`confirm-card ${confirmModal.isCriticalInput ? "critical" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-header">
              <div className={`confirm-icon-box ${confirmModal.icon === "critical" ? "critical" : "warning"}`}>
                {confirmModal.icon === "critical" ? "🔥" : "⚠️"}
              </div>
              <div>
                <div className="confirm-title">{confirmModal.title}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Repo Rover 资产安全防护中枢
                </div>
              </div>
            </div>

            <div className="confirm-desc" style={{ whiteSpace: "pre-line" }}>
              {confirmModal.description}
            </div>

            {confirmModal.warningNote && (
              <div className="confirm-danger-banner">
                {confirmModal.warningNote}
              </div>
            )}

            {confirmModal.isCriticalInput && (
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  项目名校验：<strong style={{ color: "#ff6e4a", fontFamily: "var(--font-mono)" }}>{confirmModal.targetVerifyText}</strong>
                </div>
                <input
                  type="text"
                  className="confirm-input-field"
                  placeholder={`在此输入项目名 [${confirmModal.targetVerifyText}] 以激活删除按钮`}
                  value={confirmInputVal}
                  onChange={(e) => setConfirmInputVal(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && confirmInputVal === confirmModal.targetVerifyText) {
                      confirmModal.onConfirm();
                    }
                  }}
                />
              </div>
            )}

            <div className="confirm-actions">
              <button
                className="btn-secondary"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
              >
                {confirmModal.cancelText || "取消"}
              </button>
              <button
                className={confirmModal.icon === "critical" ? "btn-confirm-danger" : "btn-primary"}
                disabled={confirmModal.isCriticalInput && confirmInputVal !== confirmModal.targetVerifyText}
                onClick={() => confirmModal.onConfirm()}
              >
                {confirmModal.confirmText || "确定"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 最高层级置顶 Toast 胶囊通知 (无论在主视窗还是在深层弹窗中均清晰可见) */}
      {actionNotice && (
        <div className="global-toast-capsule">
          <span style={{ fontSize: "16px" }}>🔔</span>
          <span>{actionNotice}</span>
        </div>
      )}
    </div>
  );
}
