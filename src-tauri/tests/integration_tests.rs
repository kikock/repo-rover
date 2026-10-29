use repo_rover_lib::git_env::*;
use repo_rover_lib::inspector::*;
use repo_rover_lib::actions::*;
use std::path::Path;

#[test]
fn test_git_environment_detection() {
    let env_info = detect_git_environment();
    println!("\n=== Git 环境检测测试 ===");
    println!("Git 是否已安装: {}", env_info.is_installed);
    println!("Git 物理路径: {:?}", env_info.git_path);
    println!("Git 运行时版本: {:?}", env_info.git_version);
    println!("全局配置条目数: {}", env_info.global_configs.len());
    println!("已发现 SSH 密钥数: {}", env_info.ssh_keys.len());

    assert!(env_info.is_installed, "预期系统中必须能探测到 Git");
    assert!(env_info.git_path.is_some(), "必须返回有效的 Git 物理路径");
}

#[test]
fn test_current_repo_inspection() {
    let current_dir = std::env::current_dir().expect("无法获取当前路径");
    let repo_dir = current_dir.parent().unwrap_or(&current_dir);
    println!("\n=== 仓库健康度体检测试 ===");
    println!("测试目标仓库路径: {:?}", repo_dir);

    let health = inspect_repository(repo_dir);
    println!("仓库名称: {}", health.name);
    println!("当前分支: {}", health.branch);
    println!("是否为 Dirty 脏工作区: {}", health.is_dirty);
    println!("未暂存修改文件数: {}", health.unstaged_count);
    println!("已暂存修改文件数: {}", health.staged_count);
    println!("未跟踪文件数: {}", health.untracked_count);
    println!("远程源提供商: {:?}", health.remote_provider);
    println!("最新提交信息: {:?}", health.last_commit_msg);

    assert!(!health.name.is_empty(), "仓库名称不可为空");
    assert!(!health.branch.is_empty(), "分支名称不可为空");
}

#[test]
fn test_global_config_read() {
    let configs = read_global_configs();
    println!("\n=== 全局 Git 配置读取测试 ===");
    for (k, v) in &configs {
        println!("- {} = {}", k, v);
    }
}
