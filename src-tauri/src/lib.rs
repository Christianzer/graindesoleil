mod backend;

use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(backend::BackendProcess(Mutex::new(None)))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            } else {
                // En dev, le proxy webpack (vue.config.js) pointe déjà vers un
                // backend lancé manuellement — rien à démarrer ici. En
                // production, on embarque et pilote nous-mêmes PHP + Laravel.
                let handle = app.handle().clone();
                if let Err(e) = backend::start_backend(&handle) {
                    log::error!("Démarrage du backend embarqué échoué : {e}");
                    if let Ok(dir) = handle.path().app_data_dir() {
                        let _ = std::fs::create_dir_all(&dir);
                        let _ = std::fs::write(dir.join("startup_error.log"), &e);
                    }
                    rfd::MessageDialog::new()
                        .set_title("Grains Moulus — erreur de démarrage")
                        .set_description(&format!(
                            "Le service local n'a pas pu démarrer. Fermez l'application, vérifiez qu'aucune autre instance n'est déjà lancée, puis réessayez.\n\n{e}"
                        ))
                        .set_level(rfd::MessageLevel::Error)
                        .show();
                    std::process::exit(1);
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::ExitRequested { .. } = event {
                backend::stop_backend(app_handle);
            }
        });
}
