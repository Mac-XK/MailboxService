use std::collections::HashMap;

use once_cell::sync::Lazy;
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct ApiResponse {
    status: u16,
    body: String,
}

// Tauri 命令：发送 HTTP 请求
#[tauri::command]
async fn fetch_api(
    url: String,
    method: String,
    token: Option<String>,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
) -> Result<ApiResponse, String> {
    log::info!("Fetching API: {} {}", method, url);

    static HTTP_CLIENT: Lazy<Client> = Lazy::new(|| {
        Client::builder()
            .cookie_store(true)
            .gzip(true)
            .brotli(true)
            .deflate(true)
            .zstd(true)
            .build()
            .expect("Failed to build HTTP client")
    });

    let client = HTTP_CLIENT.clone();

    let mut request = match method.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "DELETE" => client.delete(&url),
        "PATCH" => client.patch(&url),
        _ => return Err("Unsupported HTTP method".to_string()),
    };

    if let Some(custom_headers) = headers {
        for (key, value) in custom_headers {
            request = request.header(&key, &value);
        }
    }

    // 添加 Authorization header
    if let Some(token_value) = token {
        request = request.header("Authorization", format!("Bearer {}", token_value));
    }

    if let Some(body_value) = body {
        request = request.body(body_value);
    }

    // 发送请求
    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status().as_u16();
    log::info!("Response status: {}", status);

    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    log::info!("Response body length: {}", body.len());
    if body.len() < 500 {
        log::info!("Response body: {}", body);
    } else {
        log::info!("Response body (first 500 chars): {}", &body[..500]);
    }

    Ok(ApiResponse { status, body })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![fetch_api])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
