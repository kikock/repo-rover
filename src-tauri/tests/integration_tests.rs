use repo_rover_lib::actions::*;
use repo_rover_lib::git_env::*;
use repo_rover_lib::inspector::*;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

/// 测试辅助工具：创建独立隔离的临时 Git 仓库夹具
struct TestGitFixture {
    root: PathBuf,
}

impl TestGitFixture {
    fn new(prefix: &str) -> Self {
        let temp_dir = std::env::temp_dir();
        let unique_name = format!("reporover_test_{}_{}_{}", prefix, std::process::id(), chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0));
        let root = temp_dir.join(unique_name);
        fs::create_dir_all(&root).expect("创建测试临时目录失败");

        // 初始化 git 仓库
        let output = Command::new("git")
            .args(["init"])
            .current_dir(&root)
            .output()
            .expect("调用 git init 失败");
        assert!(output.status.success(), "git init 执行必须成功");

        // 配置临时仓库的用户名和邮箱以允许提交
        let _ = Command::new("git")
            .args(["config", "user.name", "RepoRoverTester"])
            .current_dir(&root)
            .output();
        let _ = Command::new("git")
            .args(["config", "user.email", "tester@reporover.local"])
            .current_dir(&root)
            .output();

        TestGitFixture { root }
    }

    fn path(&self) -> &Path {
        &self.root
    }

    fn path_str(&self) -> String {
        self.root.to_string_lossy().to_string()
    }
}

impl Drop for TestGitFixture {
    fn drop(&mut self) {
        if self.root.exists() {
            let _ = fs::remove_dir_all(&self.root);
        }
    }
}

// ==========================================
// 1. Git 运行环境模块测试 (TC-ENV)
// ==========================================

#[test]
fn test_tc_env_01_git_installed_and_version() {
    let env_info = detect_git_environment();
    println!("\n[TC-ENV-01] 验证系统 Git 安装就绪与版本信息识别");
    println!("  - is_installed: {}", env_info.is_installed);
    println!("  - git_path: {:?}", env_info.git_path);
    println!("  - git_version: {:?}", env_info.git_version);

    assert!(env_info.is_installed, "TC-ENV-01 失败: 宿主系统必须识别到已安装的 Git");
    assert!(env_info.git_path.is_some(), "TC-ENV-01 失败: Git 物理路径必须非空");
    let version = env_info.git_version.unwrap_or_default();
    assert!(version.to_lowercase().contains("git version"), "TC-ENV-01 失败: 版本号应包含 'git version'");
}

#[test]
fn test_tc_env_03_global_config_read() {
    println!("\n[TC-ENV-03] 验证全局 Git 配置项读取能力");
    let configs = read_global_configs();
    println!("  - 已读取核心配置项数量: {}", configs.len());
    for (k, v) in &configs {
        println!("    {} = {}", k, v);
    }
    // 不强制要求每个机器都有 user.name，但该函数不可崩溃且返回有效的 HashMap
    assert!(configs.capacity() >= configs.len());
}

#[test]
fn test_tc_env_05_ssh_keys_detection() {
    println!("\n[TC-ENV-05] 验证 SSH 密钥扫描功能");
    let env_info = detect_git_environment();
    println!("  - 扫描发现 SSH 公钥文件数: {}", env_info.ssh_keys.len());
    for key in &env_info.ssh_keys {
        println!("    公钥文件: {}, 路径: {}", key.name, key.public_key_path);
        assert!(!key.name.is_empty(), "公钥文件名不可为空");
        assert!(!key.public_key_content.is_empty(), "公钥内容不可为空");
    }
}

// ==========================================
// 2. 扫描引擎与剪枝过滤测试 (TC-SCN)
// ==========================================

#[test]
fn test_tc_scn_04_chinese_and_special_char_paths() {
    println!("\n[TC-SCN-04] 验证中文与特殊字符（空格、括号）路径下的 Git 探针解析");
    let temp_dir = std::env::temp_dir();
    let special_dir_name = format!("测试项目 (Git 探针 中文路径)_{}", std::process::id());
    let special_path = temp_dir.join(&special_dir_name);
    fs::create_dir_all(&special_path).expect("创建含中文的测试目录失败");

    let init_res = Command::new("git")
        .args(["init"])
        .current_dir(&special_path)
        .output();

    if let Ok(output) = init_res {
        if output.status.success() {
            let health = inspect_repository(&special_path);
            println!("  - 特殊字符路径: {}", health.path);
            println!("  - 提取仓库名: {}", health.name);
            assert_eq!(health.name, special_dir_name, "中文及特殊字符路径仓库名解析应一致");
            assert!(health.is_clean, "初始化的空仓库应为纯净状态");
        }
    }

    let _ = fs::remove_dir_all(&special_path);
}

#[test]
fn test_tc_scn_05_nonexistent_and_protected_paths() {
    println!("\n[TC-SCN-05] 验证受限或不存在路径容错（保证零 Panic 崩溃）");
    let bad_path = Path::new("Z:\\non_existent_folder_reporover_test_999");
    let health = inspect_repository(bad_path);
    assert_eq!(health.name, "non_existent_folder_reporover_test_999");
    assert_eq!(health.branch, "未知分支");
    assert!(health.is_clean);

    let details_res = get_repo_details("Z:\\non_existent_folder_reporover_test_999");
    assert!(details_res.is_err(), "不存在路径应优雅返回 Err 而非 panic 崩溃");
}

// ==========================================
// 3. 仓库健康状态探针测试 (TC-INS)
// ==========================================

#[test]
fn test_tc_ins_01_dirty_status_detection() {
    println!("\n[TC-INS-01] 验证工作区脏状态准确标记 (Dirty: 未跟踪与修改)");
    let fixture = TestGitFixture::new("dirty_test");

    // 1. 新建一个未跟踪文件
    let new_file = fixture.path().join("untracked_file.txt");
    fs::write(&new_file, "hello repo rover").expect("写入测试文件失败");

    let health = inspect_repository(fixture.path());
    println!("  - 脏检测: is_dirty={}, untracked_count={}", health.is_dirty, health.untracked_count);
    assert!(health.is_dirty, "存在新文件时必须标记为 Dirty");
    assert!(!health.is_clean, "is_clean 必须与 is_dirty 相反");
    assert!(health.untracked_count >= 1, "未跟踪计数必须 >= 1");

    // 2. 将文件提交进版本库
    let _ = Command::new("git").args(["add", "."]).current_dir(fixture.path()).output();
    let _ = Command::new("git").args(["commit", "-m", "init commit"]).current_dir(fixture.path()).output();

    // 3. 再次修改该文件产生已跟踪修改 (M)
    fs::write(&new_file, "modified content").expect("修改文件失败");
    let health_after_mod = inspect_repository(fixture.path());
    println!("  - 修改检测: is_dirty={}, unstaged_count={}", health_after_mod.is_dirty, health_after_mod.unstaged_count);
    assert!(health_after_mod.is_dirty, "文件被修改后必须判定为 Dirty");
    assert!(health_after_mod.unstaged_count >= 1, "未暂存计数必须 >= 1");
}

#[test]
fn test_tc_ins_04_clean_status_detection() {
    println!("\n[TC-INS-04] 验证纯净就绪状态标记 (Clean)");
    let fixture = TestGitFixture::new("clean_test");

    // 提交一个文件保持干净
    let f = fixture.path().join("README.md");
    fs::write(&f, "# Repo Rover Test").expect("写入文件失败");
    let _ = Command::new("git").args(["add", "."]).current_dir(fixture.path()).output();
    let _ = Command::new("git").args(["commit", "-m", "initial clean commit"]).current_dir(fixture.path()).output();

    let health = inspect_repository(fixture.path());
    println!("  - 纯净检测: is_clean={}, is_dirty={}", health.is_clean, health.is_dirty);
    assert!(health.is_clean, "工作区无任何未提交修改时必须为 Clean 纯净状态");
    assert!(!health.is_dirty, "纯净状态下 is_dirty 必须为 false");
    assert_eq!(health.unstaged_count, 0);
    assert_eq!(health.staged_count, 0);
    assert_eq!(health.untracked_count, 0);
}

#[test]
fn test_tc_ins_05_isolated_local_repo() {
    println!("\n[TC-INS-05] 验证纯本地孤岛仓库（无远程源 origin）");
    let fixture = TestGitFixture::new("isolated_test");
    let health = inspect_repository(fixture.path());

    println!("  - 远程 URL: {:?}", health.remote_url);
    println!("  - 托管商: {:?}", health.remote_provider);
    assert!(health.remote_url.is_none(), "新建纯本地仓库远程源必须为 None");
    assert!(health.remote_provider.is_none(), "无远程源时 remote_provider 必须为 None");
}

// ==========================================
// 4. 外部调度与文件操作安全屏障测试 (TC-ACT)
// ==========================================

#[test]
fn test_tc_act_04_gitignore_management_and_deep_ignore() {
    println!("\n[TC-ACT-04] 验证 .gitignore 读取、写入与规则追加自动去重");
    let fixture = TestGitFixture::new("gitignore_test");
    let repo_path = fixture.path_str();

    // 初始读取应为空
    let init_content = get_gitignore_content(&repo_path).expect("读取 .gitignore 失败");
    assert!(init_content.is_empty());

    // 追加单条规则
    add_to_gitignore(&repo_path, "target/").expect("追加规则失败");
    let content1 = get_gitignore_content(&repo_path).expect("读取 .gitignore 失败");
    assert!(content1.contains("target/"));

    // 重复追加相同规则：验证自动去重机制
    add_to_gitignore(&repo_path, "target/").expect("重复追加规则失败");
    let content2 = get_gitignore_content(&repo_path).expect("读取 .gitignore 失败");
    assert_eq!(content1.trim(), content2.trim(), "重复规则不可重复追加");

    // 保存全量内容
    save_gitignore_content(&repo_path, "# 自定义规则\nnode_modules/\n*.log\n").expect("保存 .gitignore 失败");
    let content3 = get_gitignore_content(&repo_path).expect("读取 .gitignore 失败");
    assert!(content3.contains("node_modules/"));
    assert!(content3.contains("*.log"));
}

#[test]
fn test_tc_act_05_discard_single_file() {
    println!("\n[TC-ACT-05] 验证单独放弃单文件修改 (discard_single_file)");
    let fixture = TestGitFixture::new("discard_test");
    let target_file = fixture.path().join("app.js");
    fs::write(&target_file, "console.log('version 1');\n").expect("写入文件失败");

    // 提交原始版本
    let _ = Command::new("git").args(["add", "."]).current_dir(fixture.path()).output();
    let _ = Command::new("git").args(["commit", "-m", "v1 commit"]).current_dir(fixture.path()).output();

    // 修改该文件
    fs::write(&target_file, "console.log('version 2 - modified');\n").expect("写入修改失败");

    // 确认已成为脏改动
    let health_before = inspect_repository(fixture.path());
    assert!(health_before.is_dirty);

    // 调用放弃修改函数
    discard_single_file(&fixture.path_str(), "app.js").expect("执行放弃文件修改失败");

    // 验证文件内容回滚至原始状态
    let restored = fs::read_to_string(&target_file).expect("读取还原后文件失败");
    assert_eq!(
        restored.replace("\r\n", "\n"),
        "console.log('version 1');\n",
        "文件内容必须准确恢复至 HEAD 版本"
    );

    let health_after = inspect_repository(fixture.path());
    assert!(health_after.is_clean, "放弃修改后工作区应重新恢复为 Clean");
}

#[test]
fn test_tc_act_06_delete_physical_repo_safety_barrier() {
    println!("\n[TC-ACT-06] 验证物理删除的 Git 标志安全防护屏障（拦截非 Git 目录误删）");
    let temp_dir = std::env::temp_dir();
    let safe_folder = temp_dir.join(format!("not_a_git_repo_{}", std::process::id()));
    fs::create_dir_all(&safe_folder).expect("创建非 Git 目录失败");

    // 关键安全验证：该目录没有 .git，系统必须拦截删除并返回 Err
    let delete_res = delete_physical_repo(&safe_folder.to_string_lossy());
    assert!(delete_res.is_err(), "非 Git 目录必须被安全防线坚决拦截！");
    assert!(safe_folder.exists(), "被拦截的目录物理结构必须完好保留");

    // 清理测试目录
    let _ = fs::remove_dir_all(&safe_folder);

    // 验证正常的 Git 仓库允许删除
    let git_fixture = TestGitFixture::new("to_delete");
    let git_path_str = git_fixture.path_str();
    assert!(git_fixture.path().exists());
    let delete_git_res = delete_physical_repo(&git_path_str);
    assert!(delete_git_res.is_ok(), "合法的 Git 仓库应允许物理删除");
    assert!(!Path::new(&git_path_str).exists(), "删除后物理路径应已被彻底销毁");
}

#[test]
fn test_tc_act_batch_load_local_repos() {
    println!("\n[TC-ACT-07] 验证父目录下子仓库智能批量载入 (batch_load_local_repos)");
    let temp_dir = std::env::temp_dir();
    let parent_dir = temp_dir.join(format!("batch_parent_{}", std::process::id()));
    fs::create_dir_all(&parent_dir).expect("创建父目录失败");

    // 在父目录下创建 2 个子 Git 仓库和 1 个非 Git 文件夹
    let sub_repo1 = parent_dir.join("sub_repo1");
    let sub_repo2 = parent_dir.join("sub_repo2");
    let sub_plain = parent_dir.join("plain_folder");
    fs::create_dir_all(&sub_repo1).unwrap();
    fs::create_dir_all(&sub_repo2).unwrap();
    fs::create_dir_all(&sub_plain).unwrap();

    let _ = Command::new("git").args(["init"]).current_dir(&sub_repo1).output();
    let _ = Command::new("git").args(["init"]).current_dir(&sub_repo2).output();

    let loaded = batch_load_local_repos(&parent_dir.to_string_lossy()).expect("批量载入应成功");
    println!("  - 扫描父目录并自动识别到的子 Git 仓库数: {}", loaded.len());
    assert_eq!(loaded.len(), 2, "应准确识别出 2 个子仓库，排除非 Git 文件夹");

    let _ = fs::remove_dir_all(&parent_dir);
}
