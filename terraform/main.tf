terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
  user_project_override = true
}

# --- Enable Required GCP APIs ---

locals {
  services = [
    "cloudresourcemanager.googleapis.com",
    "firebase.googleapis.com",
    "cloudfunctions.googleapis.com",
    "firestore.googleapis.com",
    "sheets.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "iam.googleapis.com"
  ]
}

resource "google_project_service" "api" {
  for_each                   = toset(local.services)
  project                    = var.project_id
  service                    = each.key
  disable_on_destroy         = false
  disable_dependent_services = false
}

# --- Initialize Firebase Project ---

resource "google_firebase_project" "firebase_project" {
  provider = google-beta
  project  = var.project_id

  depends_on = [
    google_project_service.api
  ]
}

# --- Create Firebase Web App ---

resource "google_firebase_web_app" "web_app" {
  provider     = google-beta
  project      = var.project_id
  display_name = var.app_name

  depends_on = [
    google_firebase_project.firebase_project
  ]
}

# --- Get Firebase Web App Config ---

data "google_firebase_web_app_config" "web_app_config" {
  provider   = google-beta
  project    = var.project_id
  web_app_id = google_firebase_web_app.web_app.app_id
}

# --- Create Default Firestore Database ---

resource "google_firestore_database" "default" {
  provider                    = google
  project                     = var.project_id
  name                        = "(default)"
  location_id                 = var.region
  type                        = "FIRESTORE_NATIVE"
  concurrency_mode            = "OPTIMISTIC"
  app_engine_integration_mode = "DISABLED"
  
  depends_on = [
    google_project_service.api["firestore.googleapis.com"]
  ]
}
