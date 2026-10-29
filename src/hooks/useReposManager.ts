import { useState, useEffect, useMemo, useCallback } from "react";
import { RepoHealth, inspectSingleRepo, isTauriEnv } from "../services/api";
import { StatusFilter } from "../types";

const CACHE_STORAGE_KEY = "reporover_cached_repos_v2";

export function useReposManager(showNotice: (msg: string) => void) {
  const [repos, setRepos] = useState<RepoHealth[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);

  // 同步更新 repos 并写入本地持久化缓存
  const updateReposWithStorage = useCallback((updater: (prev: RepoHealth[]) => RepoHealth[]) => {
    setRepos((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  }, []);

  // 后台静默刷新缓存仓库的最新健康度
  const refreshCachedReposHealth = useCallback(async (cachedList: RepoHealth[]) => {
    if (!isTauriEnv()) return;
    for (const item of cachedList) {
      try {
        const fresh = await inspectSingleRepo(item.path);
        updateReposWithStorage((prev) =>
          prev.map((r) => (r.path === item.path ? fresh : r))
        );
      } catch (_) {}
    }
  }, [updateReposWithStorage]);

  // 初始化恢复缓存
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_STORAGE_KEY);
    if (cached) {
      try {
        const parsed: RepoHealth[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRepos(parsed);
          refreshCachedReposHealth(parsed);
        }
      } catch (e) {
        console.warn("恢复本地缓存失败", e);
      }
    }
  }, [refreshCachedReposHealth]);

  // 判定是否属于内部历史缓存仓库
  const isJunkHistoryRepo = useCallback((repoPath: string) => {
    const p = repoPath.toLowerCase();
    return (
      p.includes("\\.gemini\\history") ||
      p.includes("/.gemini/history") ||
      p.includes("\\.gemini\\") ||
      p.includes("/.gemini/") ||
      p.includes("\\appdata\\local\\temp") ||
      p.includes("/temp/")
    );
  }, []);

  // 一键勾选所有历史缓存仓库
  const selectAllJunkRepos = useCallback(() => {
    const junkPaths = repos.filter((r) => isJunkHistoryRepo(r.path)).map((r) => r.path);
    setSelectedPaths(junkPaths);
    setIsBatchMode(true);
    showNotice(`🧹 已自动勾选 ${junkPaths.length} 个历史临时 Git 仓库`);
  }, [repos, isJunkHistoryRepo, showNotice]);

  // 切换单个勾选
  const toggleSelectRepo = useCallback((path: string) => {
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  }, []);

  // 过滤后的仓库列表
  const filteredRepos = useMemo(() => {
    return repos.filter((r) => {
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
  }, [repos, searchQuery, statusFilter]);

  const dirtyCount = useMemo(() => repos.filter((r) => r.is_dirty).length, [repos]);
  const unpushedCount = useMemo(() => repos.filter((r) => r.ahead_count > 0).length, [repos]);
  const cleanCount = useMemo(() => repos.filter((r) => r.is_clean && r.ahead_count === 0).length, [repos]);
  const junkReposCount = useMemo(() => repos.filter((r) => isJunkHistoryRepo(r.path)).length, [repos, isJunkHistoryRepo]);

  return {
    repos,
    setRepos,
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
  };
}
