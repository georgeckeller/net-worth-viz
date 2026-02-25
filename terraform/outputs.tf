output "project_id" {
  description = "The GCP Project ID where the application is deployed"
  value       = var.project_id
}

output "firebase_web_app_id" {
  description = "The App ID of the created Firebase Web App"
  value       = google_firebase_web_app.web_app.app_id
}

output "firebase_config" {
  description = "Firebase configuration details for your client .env file (if using full Firebase JS SDK)"
  value = {
    appId             = google_firebase_web_app.web_app.app_id
    apiKey            = data.google_firebase_web_app_config.web_app_config.api_key
    authDomain        = data.google_firebase_web_app_config.web_app_config.auth_domain
    databaseURL       = lookup(data.google_firebase_web_app_config.web_app_config, "database_url", "")
    storageBucket     = lookup(data.google_firebase_web_app_config.web_app_config, "storage_bucket", "")
    messagingSenderId = lookup(data.google_firebase_web_app_config.web_app_config, "messaging_sender_id", "")
    measurementId     = lookup(data.google_firebase_web_app_config.web_app_config, "measurement_id", "")
  }
}

output "cloud_functions_url_base" {
  description = "Base URL for the Cloud Functions, construct your VITE_API_URL and VITE_VERIFY_PASSWORD_URL from this."
  value       = "https://${var.region}-${var.project_id}.cloudfunctions.net"
}
