use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitEnvironmentInfo {
    pub is_installed: bool,
    pub git_path: Option<String>,
    pub git_version: Option<String>,
    pub global_configs: HashMap<String, String>,
    pub ssh_keys: Vec<SshKeyInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshKeyInfo {
    pub name: String,
    pub public_key_path: String,
    pub public_key_content: String,
}

/// 探查本机 Git 运行环境与全局配置
pub fn detect_git_environment() -> GitEnvironmentInfo {
    let which_git = which::which("git");
    let (is_installed, git_path, git_version) = match which_git {
        Ok(path) => {
            let path_str = path.to_string_lossy().to_string();
            let version = match crate::cmd_utils::silent_command(&path).arg("--version").output() {
                Ok(output) if output.status.success() => {
                    String::from_utf8_lossy(&output.stdout).trim().to_string()
                }
                _ => "未知版本".to_string(),
            };
            (true, Some(path_str), Some(version))
        }
        Err(_) => (false, None, None),
    };

    let global_configs = read_global_configs();
    let ssh_keys = detect_ssh_keys();

    GitEnvironmentInfo {
        is_installed,
        git_path,
        git_version,
        global_configs,
        ssh_keys,
    }
}

/// 读取核心 git config --global 配置
pub fn read_global_configs() -> HashMap<String, String> {
    let mut configs = HashMap::new();
    let keys = [
        "user.name",
        "user.email",
        "core.autocrlf",
        "init.defaultBranch",
        "credential.helper",
    ];

    for key in keys {
        if let Ok(output) = crate::cmd_utils::silent_command("git")
            .args(["config", "--global", "--get", key])
            .output()
        {
            if output.status.success() {
                let val = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !val.is_empty() {
                    configs.insert(key.to_string(), val);
                }
            }
        }
    }

    configs
}

/// 写入或更新某项 git config --global
pub fn set_global_config(key: &str, value: &str) -> Result<(), String> {
    let status = crate::cmd_utils::silent_command("git")
        .args(["config", "--global", key, value])
        .status()
        .map_err(|e| format!("写入配置失败: {}", e))?;

    if status.success() {
        Ok(())
    } else {
        Err(format!("Git 命令返回非零退出状态: {:?}", status.code()))
    }
}

/// 探查用户 ~/.ssh 目录下的公钥
pub fn detect_ssh_keys() -> Vec<SshKeyInfo> {
    let mut keys = Vec::new();
    if let Some(home) = dirs::home_dir() {
        let ssh_dir = home.join(".ssh");
        if ssh_dir.exists() && ssh_dir.is_dir() {
            if let Ok(entries) = fs::read_dir(ssh_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_file() {
                        if let Some(ext) = path.extension() {
                            if ext == "pub" {
                                if let Ok(content) = fs::read_to_string(&path) {
                                    let filename = path
                                        .file_name()
                                        .unwrap_or_default()
                                        .to_string_lossy()
                                        .to_string();
                                    keys.push(SshKeyInfo {
                                        name: filename,
                                        public_key_path: path.to_string_lossy().to_string(),
                                        public_key_content: content.trim().to_string(),
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    keys
}
