pub mod actions;
pub mod cmd_utils;
pub mod git_env;
pub mod inspector;
pub mod scanner;

use actions::*;
use git_env::*;
use inspector::*;
use scanner::*;
use tauri::AppHandle;

#[tauri::command]
fn get_git_environment_cmd() -> GitEnvironmentInfo {
    detect_git_environment()
}

#[tauri::command]
fn set_git_config_cmd(key: String, value: String) -> Result<(), String> {
    set_global_config(&key, &value)
}

#[tauri::command]
async fn start_scan_cmd(
    app: AppHandle,
    options: ScanOptions,
) -> Result<Vec<RepoHealth>, String> {
    tokio::task::spawn_blocking(move || scan_directories(app, options))
        .await
        .map_err(|e| format!("扫描任务异常: {}", e))?
}

#[tauri::command]
fn inspect_repo_cmd(repo_path: String) -> RepoHealth {
    inspect_repository(std::path::Path::new(&repo_path))
}

#[tauri::command]
fn get_repo_details_cmd(repo_path: String) -> Result<RepoDetailInfo, String> {
    get_repo_details(&repo_path)
}

#[tauri::command]
fn execute_git_action_cmd(repo_path: String, action: String) -> Result<String, String> {
    execute_git_action(&repo_path, &action)
}

#[tauri::command]
fn open_explorer_cmd(repo_path: String) -> Result<(), String> {
    open_in_explorer(&repo_path)
}

#[tauri::command]
fn open_terminal_cmd(repo_path: String) -> Result<(), String> {
    open_in_terminal(&repo_path)
}

#[tauri::command]
fn open_browser_cmd(url: String) -> Result<(), String> {
    open_in_browser(&url)
}

#[tauri::command]
fn delete_physical_repo_cmd(repo_path: String) -> Result<(), String> {
    delete_physical_repo(&repo_path)
}

#[tauri::command]
fn get_gitignore_content_cmd(repo_path: String) -> Result<String, String> {
    get_gitignore_content(&repo_path)
}

#[tauri::command]
fn save_gitignore_content_cmd(repo_path: String, content: String) -> Result<(), String> {
    save_gitignore_content(&repo_path, &content)
}

#[tauri::command]
fn add_to_gitignore_cmd(repo_path: String, rule: String) -> Result<(), String> {
    add_to_gitignore(&repo_path, &rule)
}

#[tauri::command]
fn ignore_file_deep_cmd(repo_path: String, file_path: String, is_tracked: bool) -> Result<(), String> {
    ignore_file_deep(&repo_path, &file_path, is_tracked)
}

#[tauri::command]
fn discard_single_file_cmd(repo_path: String, file_path: String) -> Result<(), String> {
    discard_single_file(&repo_path, &file_path)
}

#[tauri::command]
fn pick_folder_cmd(title: String) -> Result<Option<String>, String> {
    pick_folder(&title)
}

#[tauri::command]
fn clone_remote_repo_cmd(url: String, destination_dir: String) -> Result<String, String> {
    clone_remote_repo(&url, &destination_dir)
}

#[tauri::command]
fn configure_remote_url_cmd(repo_path: String, remote_url: String) -> Result<(), String> {
    configure_remote_url(&repo_path, &remote_url)
}

#[tauri::command]
fn batch_load_local_repos_cmd(target_path: String) -> Result<Vec<RepoHealth>, String> {
    batch_load_local_repos(&target_path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_git_environment_cmd,
            set_git_config_cmd,
            start_scan_cmd,
            inspect_repo_cmd,
            get_repo_details_cmd,
            execute_git_action_cmd,
            open_explorer_cmd,
            open_terminal_cmd,
            open_browser_cmd,
            delete_physical_repo_cmd,
            get_gitignore_content_cmd,
            save_gitignore_content_cmd,
            add_to_gitignore_cmd,
            ignore_file_deep_cmd,
            discard_single_file_cmd,
            pick_folder_cmd,
            clone_remote_repo_cmd,
            configure_remote_url_cmd,
            batch_load_local_repos_cmd
        ])
        .run(tauri::generate_context!())
        .expect("运行 Repo Rover 时发生致命错误");
}
