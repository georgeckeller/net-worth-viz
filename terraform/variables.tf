variable "project_id" {
  description = "The GCP Project ID where the application will be deployed"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources (e.g., us-central1)"
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "The name of the Firebase web app"
  type        = string
  default     = "net-worth-viz"
}
