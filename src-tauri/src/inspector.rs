use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepoHealth {
    pub name: String,
    pub path: String,
    pub branch: String,
    pub is_clean: bool,
    pub is_dirty: bool,
    pub unstaged_count: usize,
    pub staged_count: usize,
    pub untracked_count: usize,
    pub ahead_count: usize,
    pub behind_count: usize,
    pub remote_url: Option<String>,
    pub remote_provider: Option<String>,
    pub last_commit_msg: Option<String>,
    pub last_commit_time: Option<String>,
    pub last_commit_hash: Option<String>,
}

/// 对指定仓库路径进行全量健康体检
pub fn inspect_repository(repo_path: &Path) -> RepoHealth {
    let name = repo_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "未知仓库".to_string());
    let path_str = repo_path.to_string_lossy().to_string();

    let branch = get_current_branch(repo_path);
    let (unstaged_count, staged_count, untracked_count) = get_status_counts(repo_path);
    let is_dirty = unstaged_count > 0 || staged_count > 0 || untracked_count > 0;
    let is_clean = !is_dirty;

    let (ahead_count, behind_count) = get_ahead_behind(repo_path);
    let remote_url = get_remote_url(repo_path);
    let remote_provider = remote_url.as_ref().map(|url| parse_provider(url));

    let (last_commit_hash, last_commit_time, last_commit_msg) = get_last_commit(repo_path);

    RepoHealth {
        name,
        path: path_str,
        branch,
        is_clean,
        is_dirty,
        unstaged_count,
        staged_count,
        untracked_count,
        ahead_count,
        behind_count,
        remote_url,
        remote_provider,
        last_commit_msg,
        last_commit_time,
        last_commit_hash,
    }
}

fn get_current_branch(dir: &Path) -> String {
    if let Ok(output) = crate::cmd_utils::silent_command("git")
        .args(["rev-parse", "--abbrev-ref", "HEAD"])
        .current_dir(dir)
        .output()
    {
        if output.status.success() {
            let res = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !res.is_empty() {
                return res;
            }
        }
    }
    "未知分支".to_string()
}

fn get_status_counts(dir: &Path) -> (usize, usize, usize) {
    let mut unstaged = 0;
    let mut staged = 0;
    let mut untracked = 0;

    if let Ok(output) = crate::cmd_utils::silent_command("git")
        .args(["status", "--porcelain"])
        .current_dir(dir)
        .output()
    {
        if output.status.success() {
            let text = String::from_utf8_lossy(&output.stdout);
            for line in text.lines() {
                if line.len() > 3 {
                    let file_path = line[3..].trim();
                    // 排除 .gitignore 文件本身（属于 Git 忽略配置文件，不作为脏业务代码）
                    if file_path == ".gitignore"
                        || file_path.ends_with("/.gitignore")
                        || file_path.ends_with("\\.gitignore")
                    {
                        continue;
                    }

                    let x = line.as_bytes()[0] as char;
                    let y = line.as_bytes()[1] as char;

                    if x == '?' && y == '?' {
                        untracked += 1;
                    } else {
                        if x != ' ' && x != '?' {
                            staged += 1;
                        }
                        if y != ' ' && y != '?' {
                            unstaged += 1;
                        }
                    }
                }
            }
        }
    }
    (unstaged, staged, untracked)
}

fn get_ahead_behind(dir: &Path) -> (usize, usize) {
    if let Ok(output) = crate::cmd_utils::silent_command("git")
        .args(["rev-list", "--left-right", "--count", "HEAD...@{u}"])
        .current_dir(dir)
        .output()
    {
        if output.status.success() {
            let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let parts: Vec<&str> = text.split_whitespace().collect();
            if parts.len() == 2 {
                let ahead = parts[0].parse::<usize>().unwrap_or(0);
                let behind = parts[1].parse::<usize>().unwrap_or(0);
                return (ahead, behind);
            }
        }
    }
    (0, 0)
}

fn get_remote_url(dir: &Path) -> Option<String> {
    if let Ok(output) = crate::cmd_utils::silent_command("git")
        .args(["remote", "get-url", "origin"])
        .current_dir(dir)
        .output()
    {
        if output.status.success() {
            let url = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !url.is_empty() {
                return Some(url);
            }
        }
    }
    None
}

fn parse_provider(url: &str) -> String {
    let lower = url.to_lowercase();
    if lower.contains("github.com") {
        "GitHub".to_string()
    } else if lower.contains("gitlab.com") || lower.contains("gitlab") {
        "GitLab".to_string()
    } else if lower.contains("gitee.com") {
        "Gitee".to_string()
    } else if lower.contains("bitbucket.org") {
        "Bitbucket".to_string()
    } else {
        "Git 远程源".to_string()
    }
}

fn get_last_commit(dir: &Path) -> (Option<String>, Option<String>, Option<String>) {
    if let Ok(output) = crate::cmd_utils::silent_command("git")
        .args(["log", "-1", "--pretty=format:%h|%cd|%s", "--date=format:%Y-%m-%d %H:%M"])
        .current_dir(dir)
        .output()
    {
        if output.status.success() {
            let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let parts: Vec<&str> = text.splitn(3, '|').collect();
            if parts.len() == 3 {
                return (
                    Some(parts[0].to_string()),
                    Some(parts[1].to_string()),
                    Some(parts[2].to_string()),
                );
            }
        }
    }
    (None, None, None)
}
