# AquaBook - Quick Reference Guide

## 🚀 Getting Started

### First Time Setup
```bash
make quick-start
```

This single command will:
- ✅ Install frontend (npm) and backend (Go) dependencies
- ✅ Create `.env` files from templates
- ✅ Start Docker services (PostgreSQL, Redis, MinIO)
- ✅ Run database migrations
- ✅ Start development servers

Access your app:
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health

---

## 📋 Daily Development

### Start Development
```bash
make dev                # Start both frontend + backend
make dev-frontend       # Frontend only
make dev-backend        # Backend only
```

### Check Status
```bash
make status             # See all services status
make ports              # List all ports
```

### View Logs
```bash
make docker-logs        # Docker services logs
make logs-backend       # Backend API logs
```

---

## 🗄️ Database Commands

### Migrations
```bash
make migrate-up         # Apply migrations
make migrate-down       # Rollback migrations
make migrate-reset      # Reset database (down + up)
```

### Database Access
```bash
make db-shell           # Open PostgreSQL shell
make db-dump            # Backup database to file
make db-restore FILE=backup.sql  # Restore from backup
```

### PostgreSQL Shell Examples
```sql
-- List all tables
\dt

-- View users table
SELECT * FROM users;

-- Check PostGIS extension
SELECT postgis_version();

-- Find nearby users (within 50km of SF)
SELECT username, location_city, 
  ST_Distance(
    location_coords,
    ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography
  ) / 1000 as distance_km
FROM users
WHERE ST_DWithin(
  location_coords,
  ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography,
  50000
)
ORDER BY distance_km;
```

---

## 🐳 Docker Commands

### Service Management
```bash
make docker-up          # Start all services
make docker-down        # Stop all services
make docker-restart     # Restart all services
make docker-logs        # View logs (follow mode)
```

### Individual Service Access
```bash
# PostgreSQL
docker exec -it aquafolks-postgres-1 psql -U postgres -d aquabook

# Redis
docker exec -it aquafolks-redis-1 redis-cli

# MinIO Console
open http://localhost:9001
# Username: minioadmin
# Password: minioadmin
```

### Data Management
```bash
make docker-clean       # ⚠️  DELETE all data and volumes
```

---

## 🔧 Build & Production

### Build
```bash
make build              # Build both frontend + backend
make build-frontend     # Next.js production build
make build-backend      # Go binary at backend/bin/aquabook-api
```

### Start Production
```bash
make start-prod         # Start both in production mode
make start-frontend-prod # Frontend only (requires build first)
make start-backend-prod  # Backend binary only
```

---

## 🧪 Testing

```bash
make test               # Run all tests
make test-backend       # Backend tests only
make test-frontend      # Frontend tests only
```

---

## 🧹 Maintenance

### Clean Up
```bash
make clean              # Remove build artifacts
make clean-cache        # Clear all caches
```

### Code Quality
```bash
make fmt-backend        # Format Go code
make fmt-frontend       # Format frontend code
make lint-backend       # Lint Go code
make lint-frontend      # Lint frontend code
```

---

## 🌐 API Endpoints

### Authentication
```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "password123",
    "display_name": "John Doe",
    "location_city": "San Francisco",
    "location_state": "CA",
    "location_country": "USA",
    "location_lat": 37.7749,
    "location_lng": -122.4194
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_username": "johndoe",
    "password": "password123"
  }'

# Get current user (requires JWT token)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Update profile
curl -X PUT http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "John Smith",
    "bio": "Reef enthusiast"
  }'
```

### Health Check
```bash
curl http://localhost:3000/health
```

---

## 📦 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3001 | http://localhost:3001 |
| Backend API | 3000 | http://localhost:3000 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| MinIO API | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |

---

## 🎨 Design System

AquaBook uses the **Submerged Sanctuary** design system. Key principles:

- **Color Palette**: Warm cream (#fefcf1), aqua green (#13715e)
- **No-Line Rule**: Use tonal shifts instead of 1px borders
- **Signature Gradient**: 135deg linear gradient for CTAs
- **Typography**: Plus Jakarta Sans
- **Corner Radius**: Minimum 0.5rem, prefer 2rem for cards

See `design_files/aquarium_drift/DESIGN.md` for complete guidelines.

---

## 🆘 Troubleshooting

### Docker services won't start
```bash
make docker-down
make docker-up
make status
```

### Database connection errors
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database URL in backend/.env
cat backend/.env | grep DATABASE_URL

# Should be: postgresql://postgres:postgres@localhost:5432/aquabook?sslmode=disable
```

### Port already in use
```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in backend/.env
PORT=3001
```

### Frontend not connecting to backend
```bash
# Check CORS settings in backend/cmd/api/main.go
# Ensure frontend URL is in AllowOrigins

# Check frontend API URL in frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Migrations failed
```bash
# Reset database and try again
make migrate-reset

# Or manually reset
make db-shell
# In psql:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\q

make migrate-up
```

---

## 📚 Additional Resources

- **Design System**: `design_files/aquarium_drift/DESIGN.md`
- **API Documentation**: Coming soon
- **Database Schema**: `backend/migrations/000001_init_schema.up.sql`
- **All Make Commands**: `make help`

---

## 🎯 Next Steps

After setup, you can:

1. **Test Authentication**: Register a user, login, access protected endpoints
2. **Explore Database**: Use `make db-shell` to see the schema
3. **Start Building**: The repository pattern is ready for new features
4. **Set Up Supabase**: Replace local PostgreSQL with Supabase for production

Run `make help` anytime to see all available commands!
