use crate::inspector::{inspect_repository, RepoHealth};
use std::collections::HashSet;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};
use walkdir::WalkDir;

/// 扫描参数
#[derive(Debug, Clone, serde::Deserialize)]
pub struct ScanOptions {
    pub root_paths: Vec<String>,
    pub custom_exclusions: Vec<String>,
}

/// 扫描进度事件载荷
#[derive(Debug, Clone, serde::Serialize)]
pub struct ScanProgressPayload {
    pub current_directory: String,
    pub scanned_repos_count: usize,
}

/// 启动多路径剪枝扫描
pub fn scan_directories(app: AppHandle, options: ScanOptions) -> Result<Vec<RepoHealth>, String> {
    let mut default_exclusions: HashSet<String> = [
        "node_modules",
        "appdata",
        "$recycle.bin",
        "windows",
        "system volume information",
        ".gemini",
        "history",
        ".antigravity",
        ".cargo",
        ".rustup",
        "target",
        ".next",
        "dist",
        "build",
        "vendor",
        ".gradle",
        ".m2",
        "venv",
        ".venv",
        "temp",
        "tmp",
        "cache",
        ".cache",
        "program files",
        "program files (x86)",
    ]
    .iter()
    .map(|s| s.to_lowercase())
    .collect();

    for custom in options.custom_exclusions {
        default_exclusions.insert(custom.to_lowercase());
    }

    let mut discovered_repos = Vec::new();
    let mut total_found = 0;
    let mut last_progress_emit = std::time::Instant::now();
    let throttle_duration = std::time::Duration::from_millis(60);

    for root_str in options.root_paths {
        let root = PathBuf::from(&root_str);
        if !root.exists() {
            continue;
        }

        let mut it = WalkDir::new(&root)
            .follow_links(false)
            .max_depth(10)
            .into_iter();

        loop {
            let entry = match it.next() {
                None => break,
                Some(Ok(entry)) => entry,
                Some(Err(_)) => continue,
            };

            let path = entry.path();
            let file_name = entry.file_name().to_string_lossy();
            let file_name_lower = file_name.to_lowercase();

            if entry.file_type().is_dir() {
                // 1. 命中 Git 仓库标志：.git 目录
                if file_name == ".git" {
                    if let Some(parent) = path.parent() {
                        let health = inspect_repository(parent);
                        total_found += 1;

                        // 流式推送到前端
                        let _ = app.emit("scan_repo_found", &health);

                        discovered_repos.push(health);
                    }
                    // 关键性能优化：立即跳过递归遍历 .git 内部海量 objects 对象文件！
                    it.skip_current_dir();
                    continue;
                }

                // 2. 命中忽略黑名单：直接剪枝跳过整个子目录
                if default_exclusions.contains(&file_name_lower) {
                    it.skip_current_dir();
                    continue;
                }

                // 事件流控与反压：严格执行 >= 60ms 节流，禁止高频细碎事件导致 WebView2 卡死
                if last_progress_emit.elapsed() >= throttle_duration {
                    let _ = app.emit(
                        "scan_progress",
                        ScanProgressPayload {
                            current_directory: path.to_string_lossy().to_string(),
                            scanned_repos_count: total_found,
                        },
                    );
                    last_progress_emit = std::time::Instant::now();
                }
            }
        }
    }

    // 扫描完成事件
    let _ = app.emit("scan_completed", total_found);

    Ok(discovered_repos)
}
