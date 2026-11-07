// Application Windows du jeu de maths.
// Le jeu lui-même est en HTML (dossier dist/). Ce programme ajoute :
//  - la sauvegarde dans Documents\Jeu de maths\progres.json
//  - les mises à jour (plugin updater) et le redémarrage (plugin process)

// Pas de fenêtre de console noire en version finale.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

const FICHIER: &str = "progres.json";

/// Documents\Jeu de maths (créé au besoin).
/// Si le dossier Documents est introuvable, on se rabat sur le dossier de données de l'application.
fn dossier(app: &AppHandle) -> Result<PathBuf, String> {
    let d = match app.path().document_dir() {
        Ok(documents) => documents.join("Jeu de maths"),
        Err(_) => app.path().app_data_dir().map_err(|e| e.to_string())?,
    };
    fs::create_dir_all(&d).map_err(|e| format!("Impossible de créer {}: {e}", d.display()))?;
    Ok(d)
}

#[tauri::command]
fn chemin_progres(app: AppHandle) -> Result<String, String> {
    Ok(dossier(&app)?.join(FICHIER).to_string_lossy().into_owned())
}

/// Contenu de progres.json, ou rien si le fichier n'existe pas encore.
#[tauri::command]
fn lire_progres(app: AppHandle) -> Result<Option<String>, String> {
    let f = dossier(&app)?.join(FICHIER);
    if !f.exists() {
        return Ok(None);
    }
    fs::read_to_string(&f).map(Some).map_err(|e| e.to_string())
}

/// Écrit d'abord dans un fichier temporaire, puis le renomme :
/// une coupure de courant ne peut pas laisser un progres.json à moitié écrit.
#[tauri::command]
fn ecrire_progres(app: AppHandle, contenu: String) -> Result<(), String> {
    let d = dossier(&app)?;
    let tmp = d.join("progres.json.tmp");
    fs::write(&tmp, contenu.as_bytes()).map_err(|e| e.to_string())?;
    fs::rename(&tmp, d.join(FICHIER)).map_err(|e| e.to_string())
}

/// Si progres.json est illisible, on le met de côté (sans l'effacer) avant de repartir.
#[tauri::command]
fn mettre_de_cote(app: AppHandle) -> Result<String, String> {
    let d = dossier(&app)?;
    let secondes = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|t| t.as_secs())
        .unwrap_or(0);
    let nom = format!("progres-illisible-{secondes}.json");
    fs::rename(d.join(FICHIER), d.join(&nom)).map_err(|e| e.to_string())?;
    Ok(nom)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            chemin_progres,
            lire_progres,
            ecrire_progres,
            mettre_de_cote
        ])
        .run(tauri::generate_context!())
        .expect("Le jeu n'a pas pu démarrer");
}
