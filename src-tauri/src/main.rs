#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_PATH: &str = "settings.json";
const JEV_KEY: &str = "jev_api_key";
const JEV_ENDPOINT: &str = "https://api.typesafe.ai/v1/systemone";

#[tauri::command]
fn set_jev_key(app: AppHandle, key: String) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.set(JEV_KEY, serde_json::Value::String(key));
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn has_jev_key(app: AppHandle) -> Result<bool, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    let value = store.get(JEV_KEY);
    let exists = match value {
        Some(serde_json::Value::String(s)) => !s.trim().is_empty(),
        _ => false,
    };
    Ok(exists)
}

#[tauri::command]
async fn jev_analyze(app: AppHandle, body: String) -> Result<serde_json::Value, String> {
    let key = {
        let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
        match store.get(JEV_KEY) {
            Some(serde_json::Value::String(s)) if !s.trim().is_empty() => s,
            _ => return Err("JEV_API_KEY não configurada".to_string()),
        }
    };

    let client = reqwest::Client::new();
    let resp = client
        .post(JEV_ENDPOINT)
        .bearer_auth(key)
        .header("Content-Type", "application/json")
        .body(body)
        .send()
        .await
        .map_err(|e| format!("Falha ao contatar o Jev: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("Jev respondeu com status {}", resp.status()));
    }

    let json = resp
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Resposta inválida do Jev: {e}"))?;

    Ok(json)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            set_jev_key,
            has_jev_key,
            jev_analyze
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}