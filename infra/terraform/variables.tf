variable "render_api_key" {
  description = "Render API key"
  type        = string
  sensitive   = true
}

variable "render_owner_id" {
  description = "Render owner/team ID"
  type        = string
}

variable "github_repo_url" {
  description = "GitHub repo URL (https://github.com/user/repo)"
  type        = string
}

variable "secret_key" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "groq_api_key" {
  description = "Groq API key"
  type        = string
  sensitive   = true
}
