# AquaBook Makefile
# Simplified commands for development and deployment

.PHONY: help install dev build clean docker-up docker-down migrate-up migrate-down test

# Default target
.DEFAULT_GOAL := help

##@ General

help: ## Display this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

install: ## Install all dependencies (frontend + backend)
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install
	@echo "📦 Installing backend dependencies..."
	cd backend && go mod download
	@echo "✅ Dependencies installed"

dev: ## Run frontend and backend in development mode
	@echo "🚀 Starting development servers..."
	@$(MAKE) -j2 dev-frontend dev-backend

dev-frontend: ## Run frontend only (Next.js)
	@echo "⚛️  Starting Next.js frontend on http://localhost:3001..."
	cd frontend && npm run dev

dev-backend: ## Run backend only (Go API)
	@echo "🔧 Starting Go backend on http://localhost:3000..."
	cd backend && go run cmd/api/main.go

##@ Build

build: ## Build both frontend and backend for production
	@echo "🔨 Building production bundles..."
	@$(MAKE) build-frontend
	@$(MAKE) build-backend
	@echo "✅ Build complete"

build-frontend: ## Build frontend only
	@echo "⚛️  Building Next.js frontend..."
	cd frontend && npm run build

build-backend: ## Build backend only
	@echo "🔧 Building Go backend binary..."
	cd backend && go build -o bin/aquabook-api cmd/api/main.go
	@echo "✅ Backend binary created at backend/bin/aquabook-api"

##@ Docker

docker-up: ## Start all Docker services (postgres, redis, minio)
	@echo "🐳 Starting Docker services..."
	docker-compose up -d
	@echo "⏳ Waiting for services to be healthy..."
	@sleep 5
	@docker-compose ps
	@echo "✅ Docker services running"

docker-down: ## Stop all Docker services
	@echo "🐳 Stopping Docker services..."
	docker-compose down
	@echo "✅ Docker services stopped"

docker-restart: ## Restart all Docker services
	@$(MAKE) docker-down
	@$(MAKE) docker-up

docker-logs: ## Show Docker service logs
	docker-compose logs -f

docker-clean: ## Remove all Docker volumes and data (WARNING: destroys data)
	@echo "⚠️  This will delete all data in Docker volumes!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "✅ Docker volumes cleaned"; \
	fi

##@ Database

migrate-up: ## Run database migrations (apply schema)
	@echo "🗄️  Running database migrations..."
	docker exec -i aquafolks-postgres-1 psql -U postgres -d aquabook < backend/migrations/000001_init_schema.up.sql
	@echo "✅ Migrations applied"

migrate-down: ## Rollback database migrations
	@echo "🗄️  Rolling back database migrations..."
	docker exec -i aquafolks-postgres-1 psql -U postgres -d aquabook < backend/migrations/000001_init_schema.down.sql
	@echo "✅ Migrations rolled back"

migrate-reset: ## Reset database (down + up)
	@$(MAKE) migrate-down
	@$(MAKE) migrate-up

db-shell: ## Open PostgreSQL shell
	docker exec -it aquafolks-postgres-1 psql -U postgres -d aquabook

db-dump: ## Dump database to file
	@echo "💾 Dumping database..."
	docker exec aquafolks-postgres-1 pg_dump -U postgres -d aquabook > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database dumped"

db-restore: ## Restore database from file (Usage: make db-restore FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "❌ Please specify FILE parameter: make db-restore FILE=backup.sql"; \
		exit 1; \
	fi
	@echo "📥 Restoring database from $(FILE)..."
	docker exec -i aquafolks-postgres-1 psql -U postgres -d aquabook < $(FILE)
	@echo "✅ Database restored"

##@ Testing

test: ## Run all tests (backend + frontend)
	@$(MAKE) test-backend
	@$(MAKE) test-frontend

test-backend: ## Run backend tests
	@echo "🧪 Running backend tests..."
	cd backend && go test -v ./...

test-frontend: ## Run frontend tests
	@echo "🧪 Running frontend tests..."
	cd frontend && npm test

##@ Production

start-prod: ## Start production servers
	@echo "🚀 Starting production servers..."
	@$(MAKE) -j2 start-frontend-prod start-backend-prod

start-frontend-prod: ## Start production frontend
	@echo "⚛️  Starting Next.js production server..."
	cd frontend && npm run start

start-backend-prod: ## Start production backend
	@echo "🔧 Starting Go backend binary..."
	cd backend && ./bin/aquabook-api

##@ Maintenance

clean: ## Clean build artifacts and dependencies
	@echo "🧹 Cleaning build artifacts..."
	rm -rf frontend/.next
	rm -rf frontend/node_modules
	rm -rf backend/bin
	rm -rf backend/server.log
	@echo "✅ Clean complete"

clean-cache: ## Clean all caches (frontend + backend)
	@echo "🧹 Cleaning caches..."
	rm -rf frontend/.next/cache
	cd backend && go clean -cache
	@echo "✅ Caches cleaned"

logs-backend: ## Show backend logs
	tail -f backend/server.log

fmt-backend: ## Format backend Go code
	@echo "✨ Formatting Go code..."
	cd backend && go fmt ./...
	@echo "✅ Code formatted"

fmt-frontend: ## Format frontend code
	@echo "✨ Formatting frontend code..."
	cd frontend && npm run format || npx prettier --write .
	@echo "✅ Code formatted"

lint-backend: ## Lint backend Go code
	@echo "🔍 Linting Go code..."
	cd backend && go vet ./...
	@echo "✅ Linting complete"

lint-frontend: ## Lint frontend code
	@echo "🔍 Linting frontend code..."
	cd frontend && npm run lint
	@echo "✅ Linting complete"

##@ Environment

env-setup: ## Copy .env.example to .env files
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env; \
		echo "✅ Created backend/.env from .env.example"; \
	else \
		echo "⚠️  backend/.env already exists"; \
	fi
	@if [ ! -f frontend/.env.local ]; then \
		echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > frontend/.env.local; \
		echo "✅ Created frontend/.env.local"; \
	else \
		echo "⚠️  frontend/.env.local already exists"; \
	fi

##@ Quick Start

setup: ## Complete setup (install deps + docker + migrate)
	@echo "🎬 Running complete setup..."
	@$(MAKE) install
	@$(MAKE) env-setup
	@$(MAKE) docker-up
	@sleep 3
	@$(MAKE) migrate-up
	@echo ""
	@echo "✅ Setup complete! Run 'make dev' to start development"

quick-start: setup dev ## One-command setup and start (new projects)

##@ Info

status: ## Show status of all services
	@echo "📊 Service Status:"
	@echo ""
	@echo "Docker Services:"
	@docker-compose ps || echo "Docker not running"
	@echo ""
	@echo "Backend API:"
	@curl -s http://localhost:3000/health | jq . || echo "Backend not running"
	@echo ""
	@echo "Frontend:"
	@curl -s http://localhost:3001 > /dev/null && echo "Frontend running on http://localhost:3001" || echo "Frontend not running"

ports: ## Show all ports in use
	@echo "🔌 Ports:"
	@echo "  Frontend:   http://localhost:3001"
	@echo "  Backend:    http://localhost:3000"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  Redis:      localhost:6379"
	@echo "  MinIO:      http://localhost:9000 (API)"
	@echo "  MinIO UI:   http://localhost:9001 (Console)"
