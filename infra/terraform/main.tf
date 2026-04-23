terraform {
  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.8"
    }
  }
}

provider "render" {
  api_key  = var.render_api_key
  owner_id = var.render_owner_id
}

# --- PostgreSQL ---
resource "render_postgres" "db" {
  name   = "versu-db"
  plan   = "free"
  region = "oregon"
  version = "16"
}

# --- Backend (web service) ---
resource "render_web_service" "backend" {
  name   = "versu-backend"
  plan   = "free"
  region = "oregon"

  runtime_source = {
    docker = {
      repo_url   = var.github_repo_url
      branch     = "main"
      dockerfile_path = "./backend/Dockerfile"
    }
  }

  env_vars = {
    DATABASE_URL = {
      value = replace(
        replace(
          render_postgres.db.connection_info.internal_connection_string,
          "postgres://",
          "postgresql+asyncpg://"
        ),
        "postgresql://",
        "postgresql+asyncpg://"
      )
    }
    SECRET_KEY = {
      value = var.secret_key
    }
    GROQ_API_KEY = {
      value = var.groq_api_key
    }
    GROQ_MODEL = {
      value = "llama-3.1-8b-instant"
    }
  }

  depends_on = [render_postgres.db]

  lifecycle {
    ignore_changes = [
      maintenance_mode,
      notification_override,
      previews,
      pull_request_previews_enabled,
      root_directory,
      slug,
    ]
  }
}

# --- Frontend (static site) ---
resource "render_static_site" "frontend" {
  name          = "versu-frontend"
  repo_url      = var.github_repo_url
  branch        = "main"
  build_command = "cd frontend && npm ci && npm run build"
  publish_path  = "frontend/dist"

  env_vars = {
    VITE_API_URL = {
      value = render_web_service.backend.url
    }
  }

  depends_on = [render_web_service.backend]
}
