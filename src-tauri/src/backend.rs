// Backend embarqué (PHP + Laravel + SQLite).
//
// Équivalent Rust de startBackend()/stopBackend() dans l'ancien
// src/background.js (Electron) : en production, l'app ne dépend d'aucun
// serveur externe (pas d'Apache, pas de MySQL à installer) — on démarre
// notre propre serveur PHP local au lancement, avec une base SQLite propre
// à l'utilisateur.

use std::fs;
use std::io;
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::{Duration, Instant};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use tauri::{AppHandle, Manager};

pub const BACKEND_PORT: u16 = 8899;
// CREATE_NO_WINDOW : évite qu'une console PHP ne clignote à chaque appel.
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

pub struct BackendProcess(pub Mutex<Option<Child>>);

fn php_binary_path(resource_dir: &Path) -> PathBuf {
    resource_dir.join("php").join("php.exe")
}

fn backend_app_path(resource_dir: &Path) -> PathBuf {
    resource_dir.join("backend")
}

/// Tauri résout resource_dir()/app_data_dir() via canonicalize(), qui sur
/// Windows préfixe systématiquement les chemins en "\\?\C:\..." (chemin
/// étendu). Windows lui-même gère très bien ce préfixe, mais PHP ne le
/// reconnaît pas dans ses propres arguments CLI (-d extension_dir=...,
/// -t ...) : il le traite comme un chemin littéral introuvable et échoue à
/// charger toutes les extensions. On le retire avant de construire les
/// arguments passés à php.exe.
fn display_path(p: &Path) -> String {
    let s = p.to_string_lossy();
    s.strip_prefix(r"\\?\").unwrap_or(&s).to_string()
}

fn run_php(php: &Path, extension_dir: &Path, args: &[&str], cwd: &Path, envs: &[(&str, &str)]) -> io::Result<std::process::Output> {
    let mut cmd = Command::new(php);
    cmd.arg("-d").arg(format!("extension_dir={}", display_path(extension_dir)));
    cmd.args(args);
    cmd.current_dir(cwd);
    for (k, v) in envs {
        cmd.env(k, v);
    }
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd.output()
}

fn wait_for_server(port: u16, timeout: Duration) -> bool {
    let start = Instant::now();
    loop {
        if TcpStream::connect(("127.0.0.1", port)).is_ok() {
            return true;
        }
        if start.elapsed() > timeout {
            return false;
        }
        std::thread::sleep(Duration::from_millis(300));
    }
}

/// Démarre le backend embarqué. Ne fait rien en dev (le proxy webpack /
/// Apache local du développeur gère déjà l'API).
pub fn start_backend(app: &AppHandle) -> Result<(), String> {
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Dossier des ressources introuvable : {e}"))?;
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Dossier de données utilisateur introuvable : {e}"))?;

    let php = php_binary_path(&resource_dir);
    let backend = backend_app_path(&resource_dir);
    let extension_dir = php.parent().unwrap().join("ext");

    fs::create_dir_all(&app_data_dir).map_err(|e| e.to_string())?;
    let db_path = app_data_dir.join("database.sqlite");
    let storage_path = app_data_dir.join("storage");

    let premier_lancement = !db_path.exists();
    if premier_lancement {
        fs::write(&db_path, []).map_err(|e| e.to_string())?;
    }

    for sub in [
        "app/public",
        "app/backup",
        "framework/cache/data",
        "framework/sessions",
        "framework/views",
        "logs",
        "fonts", // cache des métriques de police dompdf (voir RenderAsPdf)
    ] {
        fs::create_dir_all(storage_path.join(sub)).map_err(|e| e.to_string())?;
    }

    let db_path_str = display_path(&db_path);
    let storage_path_str = display_path(&storage_path);
    let envs: &[(&str, &str)] = &[
        ("DB_CONNECTION", "sqlite"),
        ("DB_DATABASE", &db_path_str),
        ("APP_STORAGE_PATH", &storage_path_str),
    ];

    // Mise en place / mise à jour du schéma (idempotent).
    let artisan = backend.join("artisan");
    let migrate = run_php(&php, &extension_dir, &["artisan", "migrate", "--force"], &backend, envs)
        .and_then(|out| {
            if !out.status.success() {
                Err(io::Error::other(format!(
                    "code={:?} stdout={:?} stderr={:?}",
                    out.status.code(),
                    String::from_utf8_lossy(&out.stdout),
                    String::from_utf8_lossy(&out.stderr),
                )))
            } else {
                Ok(out)
            }
        });
    if let Err(e) = migrate {
        if premier_lancement {
            return Err(format!("Migration initiale échouée : {e}"));
        }
        log::error!("Migration au démarrage échouée : {e}");
    }
    let _ = artisan; // gardé pour lisibilité, chemin déjà inclus dans run_php via cwd

    let mut cmd = Command::new(&php);
    cmd.arg("-d").arg(format!("extension_dir={}", display_path(&extension_dir)));
    cmd.args([
        "-S",
        &format!("127.0.0.1:{BACKEND_PORT}"),
        "-t",
        &display_path(&backend),
        &display_path(&backend.join("index.php")),
    ]);
    cmd.current_dir(&backend);
    for (k, v) in envs {
        cmd.env(k, v);
    }
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd.stdout(std::process::Stdio::null());
    cmd.stderr(std::process::Stdio::null());

    let child = cmd.spawn().map_err(|e| format!("Impossible de démarrer le serveur local : {e}"))?;

    if let Some(state) = app.try_state::<BackendProcess>() {
        *state.0.lock().unwrap() = Some(child);
    }

    if !wait_for_server(BACKEND_PORT, Duration::from_secs(15)) {
        return Err("Le serveur local (backend) ne répond pas.".into());
    }

    Ok(())
}

pub fn stop_backend(app: &AppHandle) {
    if let Some(state) = app.try_state::<BackendProcess>() {
        if let Some(mut child) = state.0.lock().unwrap().take() {
            let _ = child.kill();
        }
    }
}
