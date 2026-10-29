import React, { useState, useEffect, useCallback } from "react";
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
} from "./services/api";
import {
  applyThemeConfig,
  getThemeConfig,
  saveThemeConfig,
  ThemeConfig,
  ThemeMode,
} from "./services/theme";
import { NavTab, ConfirmModalConfig } from "./types";
import { useReposManager } from "./hooks/useReposManager";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { RepoList } from "./components/RepoList";
import { GitEnvPanel } from "./components/GitEnvPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { AddRepoModal } from "./components/AddRepoModal";
import { GitInspectorModal } from "./components/GitInspectorModal";
import { ConfirmModal } from "./components/ConfirmModal";
import { ActionToast } from "./components/ActionToast";

const CLONE_BASE_STORAGE_KEY = "reporover_default_clone_base_dir";
export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "repos" || tab === "git-env" || tab === "settings" || tab === "dashboard") {
      return tab as NavTab;
    }
    return "dashboard";
  });
  const [themeCfg, setThemeCfg] = useState<ThemeConfig>(getThemeConfig());
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = useCallback((msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3200);
  }, []);

  // 仓库核心状态管理 Hook
  const {
    repos,
    updateReposWithStorage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedPaths,
    setSelectedPaths,
    isBatchMode,
    setIsBatchMode,
    toggleSelectRepo,
    selectAllJunkRepos,
    isJunkHistoryRepo,
    filteredRepos,
    dirtyCount,
    unpushedCount,
    cleanCount,
    junkReposCount,
  } = useReposManager(showNotice);

  // 全盘扫描状态
  const [isScanning, setIsScanning] = useState(false);
  const [currentScanningPath, setCurrentScanningPath] = useState("");
  const [scanRoots, setScanRoots] = useState("D:\\code\nC:\\Users\\ck");
  const [customExcludes, setCustomExcludes] = useState(
    "node_modules\ntarget\n.next\nAppData\n.gemini\nhistory"
  );

  // 弹窗与控制台状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [defaultCloneBaseDir, setDefaultCloneBaseDir] = useState<string>(() => {
    return localStorage.getItem(CLONE_BASE_STORAGE_KEY) || "D:\\code";
  });
  const [selectedRepo, setSelectedRepo] = useState<RepoHealth | null>(null);
  const [repoDetails, setRepoDetails] = useState<RepoDetailInfo | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [gitActionRunning, setGitActionRunning] = useState(false);
  const [consoleLog, setConsoleLog] = useState<string | null>(null);

  // .gitignore 编辑抽屉状态
  const [isGitignoreOpen, setIsGitignoreOpen] = useState(false);
  const [gitignoreContent, setGitignoreContent] = useState("");
  const [loadingGitignore, setLoadingGitignore] = useState(false);
  const [savingGitignore, setSavingGitignore] = useState(false);

  // Git 环境表单
  const [gitEnv, setGitEnv] = useState<GitEnvironmentInfo | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editAutoCrlf, setEditAutoCrlf] = useState("true");

  // 自研 Fluent 确认弹窗
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // 初始化环境与主题
  useEffect(() => {
    const cfg = getThemeConfig();
    applyThemeConfig(cfg);
    setThemeCfg(cfg);
    loadEnv();

    const handleNoticeEvent = (e: any) => {
      if (e.detail) showNotice(e.detail);
    };
    window.addEventListener("repo-rover-notice", handleNoticeEvent);
    return () => window.removeEventListener("repo-rover-notice", handleNoticeEvent);
  }, [showNotice]);

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

  // 全盘扫描触发
  const handleTriggerScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setCurrentScanningPath("正在初始化多线程剪枝遍历引擎...");
    const roots = scanRoots.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
    const excludes = customExcludes.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);

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
        (dir) => setCurrentScanningPath(dir)
      );
      showNotice("🎉 全盘仓库探针扫描完成，资产已自动持久化保存！");
    } catch (e: any) {
      showNotice(`扫描过程中出现异常: ${e.message || e}`);
    } finally {
      setIsScanning(false);
      setCurrentScanningPath("");
    }
  };

  // 打开仓库详情面板
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

  // 刷新当前仓库健康状态
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

  // 执行 Git 动作 (pull, push, fetch, stash, etc.)
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

  // 保存 Git 配置
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

  // 移除仓库跟踪
  const handleRemoveRepoTrack = (repoPath: string, repoName: string) => {
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
        if (selectedRepo?.path === repoPath) setSelectedRepo(null);
        showNotice(`🗑️ 已将 [${repoName}] 从资产清单移除`);
        setConfirmModal((m) => ({ ...m, isOpen: false }));
      },
    });
  };

  // 批量移除选中的跟踪
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
        if (selectedRepo && pathSet.has(selectedRepo.path)) setSelectedRepo(null);
        setSelectedPaths([]);
        setIsBatchMode(false);
        showNotice(`🗑️ 已成功批量移除 ${count} 个仓库资产跟踪`);
        setConfirmModal((m) => ({ ...m, isOpen: false }));
      },
    });
  };

  // 彻底删除本地物理目录
  const handleDeletePhysicalRepoConfirm = (repoPath: string, repoName: string) => {
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
      },
    });
  };

  // .gitignore 编辑处理
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

  const handleQuickAddGitignore = async (rule: string) => {
    if (!selectedRepo) return;
    try {
      await addToGitignore(selectedRepo.path, rule);
      showNotice(`🙈 已成功将规则 [${rule}] 写入 .gitignore`);
      if (isGitignoreOpen) {
        const updated = await getGitignoreContent(selectedRepo.path);
        setGitignoreContent(updated);
      }
      await refreshCurrentRepo(selectedRepo.path);
    } catch (err: any) {
      showNotice(`追加规则失败: ${err.message || err}`);
    }
  };

  const handleDeepIgnore = async (filePath: string, isTracked: boolean) => {
    if (!selectedRepo) return;
    try {
      await ignoreFileDeep(selectedRepo.path, filePath, isTracked);
      showNotice(`🙈 已成功忽略 [${filePath}] 并压制跟踪`);
      if (isGitignoreOpen) {
        const updated = await getGitignoreContent(selectedRepo.path);
        setGitignoreContent(updated);
      }
      await refreshCurrentRepo(selectedRepo.path);
    } catch (err: any) {
      showNotice(`忽略失败: ${err.message || err}`);
    }
  };

  const handleDiscardSingleFile = async (filePath: string) => {
    if (!selectedRepo) return;
    try {
      await discardSingleFile(selectedRepo.path, filePath);
      showNotice(`↩️ 已还原文件修改: [${filePath}]`);
      await refreshCurrentRepo(selectedRepo.path);
    } catch (err: any) {
      showNotice(`还原失败: ${err.message || err}`);
    }
  };

  const handleExportMarkdown = () => {
    if (repos.length === 0) {
      showNotice("当前没有已发现的仓库可供导出");
      return;
    }
    let md = `# 本地 Git 仓库资产清单 (Repo Rover 导出)\n\n`;
    md += `> 导出时间：${new Date().toLocaleString()} | 仓库总计：${repos.length} 个\n\n`;
    md += `| 仓库名称 | 分支 | 状态 | 远程源 | 本地物理路径 |\n| :--- | :--- | :--- | :--- | :--- |\n`;
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

  return (
    <div className="app-container">
      {/* 侧边导航栏 */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        reposCount={repos.length}
      />

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
            <button className="btn-secondary" onClick={() => setIsAddModalOpen(true)}>
              ➕ 添加仓库
            </button>
            <button
              className="btn-primary"
              onClick={handleTriggerScan}
              disabled={isScanning}
              style={{ opacity: isScanning ? 0.7 : 1 }}
            >
              {isScanning ? "⏳ 正在并发剪枝扫描..." : "⚡ 启动全盘探针扫描"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                const nextMode: ThemeMode = themeCfg.mode === "light" ? "dark" : "light";
                const nextCfg: ThemeConfig = { ...themeCfg, mode: nextMode };
                saveThemeConfig(nextCfg);
                setThemeCfg(nextCfg);
              }}
            >
              {themeCfg.mode === "light" ? "☀️ 浅色" : "🌙 深色"}
            </button>
            <button className="btn-secondary" onClick={() => setActiveTab("settings")}>
              🎨 主题色盘
            </button>
          </div>
        </header>

        {/* 动态内容区 */}
        <section className="content-area">
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

          {activeTab === "dashboard" && (
            <Dashboard
              totalCount={repos.length}
              dirtyCount={dirtyCount}
              unpushedCount={unpushedCount}
              cleanCount={cleanCount}
              onNavigateRepos={() => setActiveTab("repos")}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onExportMarkdown={handleExportMarkdown}
            />
          )}

          {(activeTab === "repos" || activeTab === "dashboard") && (
            <RepoList
              repos={repos}
              filteredRepos={filteredRepos}
              dirtyCount={dirtyCount}
              unpushedCount={unpushedCount}
              cleanCount={cleanCount}
              statusFilter={statusFilter}
              onFilterChange={setStatusFilter}
              isBatchMode={isBatchMode}
              onToggleBatchMode={() => {
                setIsBatchMode(!isBatchMode);
                if (isBatchMode) setSelectedPaths([]);
              }}
              selectedPaths={selectedPaths}
              onSelectAllFiltered={() => setSelectedPaths(filteredRepos.map((r) => r.path))}
              onClearSelected={() => setSelectedPaths([])}
              onBatchRemove={handleBatchRemoveConfirm}
              hasJunkRepos={repos.some((r) => isJunkHistoryRepo(r.path))}
              junkReposCount={junkReposCount}
              onSelectAllJunk={selectAllJunkRepos}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onExportMarkdown={handleExportMarkdown}
              onToggleSelectRepo={toggleSelectRepo}
              onOpenRepoModal={handleOpenRepoModal}
              onOpenTerminal={openInTerminal}
              onOpenExplorer={openInExplorer}
              onOpenBrowser={openInBrowser}
              onRemoveTrack={handleRemoveRepoTrack}
            />
          )}

          {activeTab === "git-env" && (
            <GitEnvPanel
              gitEnv={gitEnv}
              editUserName={editUserName}
              editUserEmail={editUserEmail}
              editAutoCrlf={editAutoCrlf}
              onUserNameChange={setEditUserName}
              onUserEmailChange={setEditUserEmail}
              onAutoCrlfChange={setEditAutoCrlf}
              onSaveGitConfig={handleSaveGitConfig}
              onCopySshKey={(content) => {
                navigator.clipboard.writeText(content);
                showNotice("📋 公钥已成功复制到系统剪贴板！");
              }}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPanel
              themeCfg={themeCfg}
              scanRoots={scanRoots}
              customExcludes={customExcludes}
              onThemeModeChange={(mode) => {
                const nextCfg = { ...themeCfg, mode };
                saveThemeConfig(nextCfg);
                setThemeCfg(nextCfg);
              }}
              onSelectPreset={(presetId, mode) => {
                const nextCfg = {
                  ...themeCfg,
                  selectedLightPreset: mode === "light" ? presetId : themeCfg.selectedLightPreset,
                  selectedDarkPreset: mode === "dark" ? presetId : themeCfg.selectedDarkPreset,
                };
                saveThemeConfig(nextCfg);
                setThemeCfg(nextCfg);
              }}
              onToggleCustomAccent={(useCustom) => {
                const nextCfg = { ...themeCfg, useCustomAccent: useCustom };
                saveThemeConfig(nextCfg);
                setThemeCfg(nextCfg);
              }}
              onSelectAccentColor={(color) => {
                const nextCfg = { ...themeCfg, customAccent: color, useCustomAccent: true };
                saveThemeConfig(nextCfg);
                setThemeCfg(nextCfg);
              }}
              onScanRootsChange={setScanRoots}
              onCustomExcludesChange={setCustomExcludes}
              onSaveExcludes={() => showNotice("规则已更新保存！")}
            />
          )}
        </section>
      </main>

      {/* 弹窗组件集合 */}
      <AddRepoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultCloneBaseDir={defaultCloneBaseDir}
        onDefaultCloneBaseDirChange={(val) => {
          setDefaultCloneBaseDir(val);
          localStorage.setItem(CLONE_BASE_STORAGE_KEY, val);
        }}
        onLoadLocalRepo={async (path, forceBatch) => {
          if (!forceBatch) {
            try {
              const health = await inspectSingleRepo(path);
              if (health && health.name) {
                updateReposWithStorage((prev) => {
                  if (prev.some((r) => r.path.toLowerCase() === health.path.toLowerCase())) return prev;
                  return [health, ...prev];
                });
                showNotice(`✅ 已成功将仓库 [${health.name}] 纳入代码资产管理库！`);
                return;
              }
            } catch (_) {}
          }
          const batchList = await batchLoadLocalRepos(path);
          if (batchList && batchList.length > 0) {
            let addedCount = 0;
            updateReposWithStorage((prev) => {
              const existingMap = new Set(prev.map((r) => r.path.toLowerCase()));
              const news = batchList.filter((b) => !existingMap.has(b.path.toLowerCase()));
              addedCount = news.length;
              return [...news, ...prev];
            });
            showNotice(`🎉 智能批量载入完成！发现并新增了 ${addedCount} 个 Git 仓库`);
          } else {
            showNotice("未在该目录下检测到任何 Git 仓库");
          }
        }}
        onStartCloneRepo={async (url, targetDir) => {
          await cloneRemoteRepo(url, targetDir);
          const health = await inspectSingleRepo(targetDir);
          if (health && health.name) {
            updateReposWithStorage((prev) => {
              if (prev.some((r) => r.path.toLowerCase() === health.path.toLowerCase())) return prev;
              return [health, ...prev];
            });
            showNotice(`🎉 成功拉取远程仓库 [${health.name}] 并纳管！`);
          }
        }}
        onPickFolder={pickFolder}
        showNotice={showNotice}
      />

      <GitInspectorModal
        repo={selectedRepo}
        repoDetails={repoDetails}
        loadingDetails={loadingDetails}
        gitActionRunning={gitActionRunning}
        consoleLog={consoleLog}
        isGitignoreOpen={isGitignoreOpen}
        gitignoreContent={gitignoreContent}
        loadingGitignore={loadingGitignore}
        savingGitignore={savingGitignore}
        onClose={() => setSelectedRepo(null)}
        onRefreshRepo={refreshCurrentRepo}
        onRunGitAction={handleRunGitAction}
        onOpenTerminal={openInTerminal}
        onOpenExplorer={openInExplorer}
        onOpenBrowser={openInBrowser}
        onRemoveTrack={handleRemoveRepoTrack}
        onDeletePhysicalConfirm={handleDeletePhysicalRepoConfirm}
        onDiscardWorkingTreeConfirm={() => {
          if (!selectedRepo) return;
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
            },
          });
        }}
        onSaveRemoteUrl={async (newUrl) => {
          if (!selectedRepo) return;
          await configureRemoteUrl(selectedRepo.path, newUrl);
          showNotice(`✅ 成功将远程拉取地址 (origin) 更新为: ${newUrl}`);
          if (repoDetails) setRepoDetails({ ...repoDetails, remote_url: newUrl });
          setSelectedRepo({ ...selectedRepo, remote_url: newUrl });
        }}
        onToggleGitignore={handleToggleGitignore}
        onGitignoreContentChange={setGitignoreContent}
        onSaveGitignore={handleSaveGitignore}
        onQuickAddGitignore={handleQuickAddGitignore}
        onDeepIgnore={handleDeepIgnore}
        onDiscardSingleFile={handleDiscardSingleFile}
      />

      <ConfirmModal
        config={confirmModal}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <ActionToast message={actionNotice} />
    </div>
  );
}
