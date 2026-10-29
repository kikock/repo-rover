use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangedFileInfo {
    pub status: String, // "M", "A", "D", "??"
    pub file_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitItem {
    pub hash: String,
    pub date: String,
    pub author: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepoDetailInfo {
    pub changed_files: Vec<ChangedFileInfo>,
    pub recent_commits: Vec<CommitItem>,
    pub branches: Vec<String>,
}

/// 在 Windows 文件资源管理器中高亮定位仓库
pub fn open_in_explorer(repo_path: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        crate::cmd_utils::silent_command("explorer")
            .arg(repo_path)
            .spawn()
            .map_err(|e| format!("打开文件管理器失败: {}", e))?;
    }
    Ok(())
}

/// 在仓库路径下启动终端 (Windows Terminal / PowerShell / cmd)
pub fn open_in_terminal(repo_path: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // 优先尝试打开 Windows Terminal (wt.exe)
        let wt_res = Command::new("wt")
            .args(["-d", repo_path])
            .spawn();

        if wt_res.is_err() {
            // 回退到 powershell
            crate::cmd_utils::silent_command("cmd")
                .args(["/C", "start", "powershell", "-NoExit", "-Command", &format!("Set-Location '{}'", repo_path)])
                .spawn()
                .map_err(|e| format!("启动终端失败: {}", e))?;
        }
    }
    Ok(())
}

/// 在默认浏览器中打开远程仓库 URL
pub fn open_in_browser(url: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        crate::cmd_utils::silent_command("cmd")
            .args(["/C", "start", "", url])
            .spawn()
            .map_err(|e| format!("打开浏览器失败: {}", e))?;
    }
    Ok(())
}

/// 获取仓库详细详情（变更文件清单、历史提交列表与分支）
pub fn get_repo_details(repo_path: &str) -> Result<RepoDetailInfo, String> {
    let path = Path::new(repo_path);
    if !path.exists() {
        return Err("仓库路径不存在".to_string());
    }

    // 1. 获取变更文件清单
    let mut changed_files = Vec::new();
    if let Ok(output) = crate::cmd_utils::silent_command("git")
        .args(["status", "--porcelain", "-uall"])
        .current_dir(path)
        .output()
    {
        if output.status.success() {
            let text = String::from_utf8_lossy(&output.stdout);
            for line in text.lines() {
                if line.len() > 3 {
                    let status = line[0..2].trim().to_string();
                    let file = line[3..].trim().to_string();

                    // 排除 .gitignore 文件本身（属于 Git 配置，不纳入变动清单）
                    if file == ".gitignore" || file.ends_with("/.gitignore") || file.ends_with("\\.gitignore") {
                        continue;
                    }

                    changed_files.push(ChangedFileInfo {
                        status: if status.is_empty() { "?".to_string() } else { status },
                        file_path: file,
                    });
                }
            }
        }
    }

    // 2. 获取最近 8 条提交日志
    let mut recent_commits = Vec::new();
    if let Ok(output) = crate::cmd_utils::silent_command("git")
        .args(["log", "-8", "--pretty=format:%h|%cd|%an|%s", "--date=format:%Y-%m-%d %H:%M"])
        .current_dir(path)
        .output()
    {
        if output.status.success() {
            let text = String::from_utf8_lossy(&output.stdout);
            for line in text.lines() {
                let parts: Vec<&str> = line.splitn(4, '|').collect();
                if parts.len() == 4 {
                    recent_commits.push(CommitItem {
                        hash: parts[0].to_string(),
                        date: parts[1].to_string(),
                        author: parts[2].to_string(),
                        message: parts[3].to_string(),
                    });
                }
            }
        }
    }

    // 3. 获取分支列表
    let mut branches = Vec::new();
    if let Ok(output) = crate::cmd_utils::silent_command("git")
        .args(["branch"])
        .current_dir(path)
        .output()
    {
        if output.status.success() {
            let text = String::from_utf8_lossy(&output.stdout);
            for line in text.lines() {
                let clean = line.replace('*', "").trim().to_string();
                if !clean.is_empty() {
                    branches.push(clean);
                }
            }
        }
    }

    Ok(RepoDetailInfo {
        changed_files,
        recent_commits,
        branches,
    })
}

/// 执行特定 Git 交互操作（pull / push / fetch / stash / stash_pop / discard）
pub fn execute_git_action(repo_path: &str, action: &str) -> Result<String, String> {
    let path = Path::new(repo_path);
    if !path.exists() {
        return Err("仓库路径不存在".to_string());
    }

    let args: Vec<&str> = match action {
        "pull" => vec!["pull"],
        "fetch" => vec!["fetch", "--all", "--prune"],
        "push" => vec!["push"],
        "stash" => vec!["stash", "save", "Repo Rover 快捷暂存现场"],
        "stash_pop" => vec!["stash", "pop"],
        "discard" => vec!["checkout", ".", "--"],
        _ => return Err(format!("不支持的 Git 操作指令: {}", action)),
    };

    let output = crate::cmd_utils::silent_command("git")
        .args(&args)
        .current_dir(path)
        .output()
        .map_err(|e| format!("执行指令失败: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if output.status.success() {
        if stdout.is_empty() {
            Ok(if stderr.is_empty() { "操作已成功执行完成".to_string() } else { stderr })
        } else {
            Ok(stdout)
        }
    } else {
        Err(if !stderr.is_empty() { stderr } else { stdout })
    }
}

/// 彻底安全删除本地物理仓库文件夹（带 Git 仓库标志校验防误删）
pub fn delete_physical_repo(repo_path: &str) -> Result<(), String> {
    let path = Path::new(repo_path);
    if !path.exists() {
        return Err("目标路径不存在".to_string());
    }
    // 安全屏障：必须包含 .git 目录才允许删除，防止误删根盘符或重要系统路径
    if !path.join(".git").exists() {
        return Err("该目录并非有效的 Git 仓库，系统已安全拦截删除请求".to_string());
    }
    std::fs::remove_dir_all(path).map_err(|e| format!("删除文件夹失败: {}", e))?;
    Ok(())
}

/// 读取仓库根目录下的 .gitignore 内容
pub fn get_gitignore_content(repo_path: &str) -> Result<String, String> {
    let path = Path::new(repo_path);
    if !path.exists() {
        return Err("仓库路径不存在".to_string());
    }
    let gitignore_path = path.join(".gitignore");
    if !gitignore_path.exists() {
        return Ok(String::new());
    }
    std::fs::read_to_string(&gitignore_path).map_err(|e| format!("读取 .gitignore 失败: {}", e))
}

/// 保存或更新仓库根目录下的 .gitignore 内容
pub fn save_gitignore_content(repo_path: &str, content: &str) -> Result<(), String> {
    let path = Path::new(repo_path);
    if !path.exists() {
        return Err("仓库路径不存在".to_string());
    }
    let gitignore_path = path.join(".gitignore");
    std::fs::write(&gitignore_path, content).map_err(|e| format!("写入 .gitignore 失败: {}", e))
}

/// 快捷向 .gitignore 追加一条忽略规则（智能去重与规范换行）
pub fn add_to_gitignore(repo_path: &str, rule: &str) -> Result<(), String> {
    let path = Path::new(repo_path);
    if !path.exists() {
        return Err("仓库路径不存在".to_string());
    }
    let rule_trimmed = rule.trim();
    if rule_trimmed.is_empty() {
        return Ok(());
    }

    let gitignore_path = path.join(".gitignore");
    let current_content = if gitignore_path.exists() {
        std::fs::read_to_string(&gitignore_path).unwrap_or_default()
    } else {
        String::new()
    };

    // 检查是否已包含该规则
    for line in current_content.lines() {
        if line.trim() == rule_trimmed {
            return Ok(()); // 规则已存在，无需重复追加
        }
    }

    let mut new_content = current_content;
    if !new_content.is_empty() && !new_content.ends_with('\n') {
        new_content.push('\n');
    }
    new_content.push_str(rule_trimmed);
    new_content.push('\n');

    std::fs::write(&gitignore_path, new_content).map_err(|e| format!("追加规则至 .gitignore 失败: {}", e))
}

/// 深度忽略文件（针对已跟踪文件 M 自动执行 git update-index --assume-unchanged，彻底解决写入 gitignore 依然无效的痛点）
pub fn ignore_file_deep(repo_path: &str, file_path: &str, is_tracked: bool) -> Result<(), String> {
    let path = Path::new(repo_path);
    if !path.exists() {
        return Err("仓库路径不存在".to_string());
    }

    // 1. 追加到 .gitignore
    let _ = add_to_gitignore(repo_path, file_path);

    // 2. 如果是已被 Git 跟踪的版本文件 (M)，单纯写入 .gitignore 不会生效，必须执行 assume-unchanged 深度压制
    if is_tracked {
        let _ = crate::cmd_utils::silent_command("git")
            .args(["update-index", "--assume-unchanged", file_path])
            .current_dir(path)
            .output();
    }
    Ok(())
}

/// 单独放弃/还原某个文件的未提交修改 (git checkout -- <file>)
pub fn discard_single_file(repo_path: &str, file_path: &str) -> Result<(), String> {
    let path = Path::new(repo_path);
    if !path.exists() {
        return Err("仓库路径不存在".to_string());
    }
    let output = crate::cmd_utils::silent_command("git")
        .args(["checkout", "--", file_path])
        .current_dir(path)
        .output()
        .map_err(|e| format!("还原文件失败: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

/// 弹出系统原生选择文件夹窗口 (Windows FolderBrowserDialog)
pub fn pick_folder(title: &str) -> Result<Option<String>, String> {
    #[cfg(target_os = "windows")]
    {
        let escaped_title = title.replace('\'', "''");
        let script = format!(
            "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; \
             $f = New-Object System.Windows.Forms.FolderBrowserDialog; \
             $f.Description = '{}'; \
             $f.ShowNewFolderButton = $true; \
             if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {{ \
                 Write-Output $f.SelectedPath \
             }}",
            escaped_title
        );
        let output = crate::cmd_utils::silent_command("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &script])
            .output()
            .map_err(|e| format!("启动文件夹选择器失败: {}", e))?;

        let res = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if res.is_empty() {
            Ok(None)
        } else {
            Ok(Some(res))
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(None)
    }
}

/// 从远程克隆拉取 Git 仓库至本地目标路径 (git clone <url> <destination_dir>)
pub fn clone_remote_repo(url: &str, destination_dir: &str) -> Result<String, String> {
    let dest_path = Path::new(destination_dir);
    if dest_path.exists() && dest_path.read_dir().map(|mut d| d.next().is_some()).unwrap_or(false) {
        return Err("目标目录已存在且非空，请选择其他文件夹名称".to_string());
    }

    if let Some(parent) = dest_path.parent() {
        if !parent.exists() {
            let _ = std::fs::create_dir_all(parent);
        }
    }

    let output = crate::cmd_utils::silent_command("git")
        .args(["clone", "--progress", url, destination_dir])
        .output()
        .map_err(|e| format!("调用 git clone 失败: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if output.status.success() {
        let msg = if !stderr.is_empty() { stderr } else { stdout };
        Ok(if msg.is_empty() { "远程仓库已克隆就绪".to_string() } else { msg })
    } else {
        Err(if !stderr.is_empty() { stderr } else { stdout })
    }
}

/// 配置或更新本地仓库的远程拉取源地址 (git remote origin)
pub fn configure_remote_url(repo_path: &str, remote_url: &str) -> Result<(), String> {
    let path = Path::new(repo_path);
    if !path.exists() {
        return Err("仓库路径不存在".to_string());
    }

    // 检查是否存在 origin
    let check = crate::cmd_utils::silent_command("git")
        .args(["remote", "get-url", "origin"])
        .current_dir(path)
        .output();

    let has_origin = check.map(|o| o.status.success()).unwrap_or(false);

    let output = if has_origin {
        crate::cmd_utils::silent_command("git")
            .args(["remote", "set-url", "origin", remote_url])
            .current_dir(path)
            .output()
    } else {
        crate::cmd_utils::silent_command("git")
            .args(["remote", "add", "origin", remote_url])
            .current_dir(path)
            .output()
    };

    let res = output.map_err(|e| format!("配置远程源失败: {}", e))?;
    if res.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&res.stderr).trim().to_string())
    }
}

/// 智能加载本地仓库（如果是仓库则直接加载，如果是非仓库但包含子仓库的目录，则自动批量加载其直接子仓库）
pub fn batch_load_local_repos(target_path: &str) -> Result<Vec<crate::inspector::RepoHealth>, String> {
    let path = Path::new(target_path);
    if !path.exists() {
        return Err("指定的本地路径不存在".to_string());
    }

    // 1. 如果该目录本身就是有效的 Git 仓库
    if path.join(".git").exists() {
        let health = crate::inspector::inspect_repository(path);
        return Ok(vec![health]);
    }

    // 2. 如果不是，扫描直接子目录（深度为 1）
    let mut found = Vec::new();
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let child_path = entry.path();
            if child_path.is_dir() && child_path.join(".git").exists() {
                found.push(crate::inspector::inspect_repository(&child_path));
            }
        }
    }

    if found.is_empty() {
        Err("该目录下未检测到任何有效的 Git 仓库（需包含 .git 目录）".to_string())
    } else {
        Ok(found)
    }
}

