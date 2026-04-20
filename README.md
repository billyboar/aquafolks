# AquaBook 🐠

A platform for aquarium hobbyists to showcase tanks, connect with the community, and discover aquatic life.

## Design Philosophy: The Submerged Sanctuary

AquaBook follows the "Submerged Sanctuary" design system - a warm, organic, and fluid interface that evokes the feeling of looking into a high-end rimless aquascape. See `design_files/aquarium_drift/DESIGN.md` for the complete design system.

## Tech Stack

### Backend
- **Go** with Fiber framework
- **PostgreSQL** (Supabase) with PostGIS for location-based search
- **Redis** for caching and sessions
- **Repository Pattern** for easy database migration

### Frontend
- **Next.js 15** (App Router) with TypeScript
- **Tailwind CSS** with custom design system
- **TanStack Query** for server state (coming soon)
- **Plus Jakarta Sans** typography

### Infrastructure
- **Supabase** - Managed PostgreSQL (free tier → $25/mo)
- **Hetzner CX22** - Go API server ($4.50/mo)
- **Hetzner Object Storage** - Media files ($5/mo)
- **Cloudflare** - CDN (free)

**Total Cost:** ~$10-30/mo depending on scale

---

## Quick Start

### Prerequisites
- Go 1.21+
- Node.js 20+
- Docker & Docker Compose
- Make (GNU Make)

### ⚡ One-Command Setup (New Project)

```bash
# Complete setup + start development servers
make quick-start
```

This will:
1. Install all dependencies
2. Set up environment files
3. Start Docker services (PostgreSQL, Redis, MinIO)
4. Run database migrations
5. Start both frontend and backend

### 🚀 Manual Setup

#### 1. Install Dependencies

```bash
make install
```

#### 2. Set Up Environment

```bash
make env-setup
# This creates backend/.env and frontend/.env.local
```

#### 3. Start Docker Services

```bash
make docker-up
```

#### 4. Run Database Migrations

```bash
make migrate-up
```

#### 5. Start Development Servers

```bash
# Start both frontend and backend
make dev

# Or run individually:
make dev-frontend  # Next.js on http://localhost:3001
make dev-backend   # Go API on http://localhost:3000
```

### 📊 Check Status

```bash
# View all service status
make status

# View port information
make ports
```

### 🛠️ Common Commands

```bash
make help           # Show all available commands
make build          # Build for production
make test           # Run tests
make clean          # Clean build artifacts
make docker-logs    # View Docker logs
make db-shell       # Open PostgreSQL shell
make migrate-reset  # Reset database
```
- MinIO Console: http://localhost:9001 (minioadmin / minioadmin)

---

## Project Structure

```
aquabook/
├── backend/
│   ├── cmd/api/              # Entry point
│   ├── internal/
│   │   ├── domain/           # Business entities
│   │   ├── repository/       # Data access (abstraction layer)
│   │   ├── service/          # Business logic
│   │   ├── handler/          # HTTP handlers
│   │   └── middleware/       # Auth, CORS, etc.
│   └── pkg/                  # Shared utilities
│
├── frontend/
│   ├── app/                  # Next.js App Router
│   ├── components/           # React components
│   └── lib/                  # Utilities & API client
│
├── design_files/             # UI/UX design system
└── docker-compose.yml        # Local development services
```

---

## Development Roadmap

### ✅ Phase 0: Project Setup (Current)
- [x] Initialize Go backend with repository pattern
- [x] Initialize Next.js with design system
- [x] Docker Compose for local dev
- [ ] Database migrations setup
- [ ] Environment configuration

### 🚧 Phase 1: User System (Next)
- [ ] User registration & login
- [ ] OAuth (Google, Discord, Facebook)
- [ ] JWT authentication
- [ ] User profiles with location

### 📋 Phase 2: Tank Showcase
- [ ] Tank CRUD operations
- [ ] Photo uploads to object storage
- [ ] Livestock/plant inventory
- [ ] Tank feed with filters
- [ ] Comments & likes

### 📋 Phase 3: Marketplace
- [ ] Listing CRUD
- [ ] PostGIS location search (radius queries)
- [ ] Photo uploads
- [ ] Full-text search
- [ ] Category filters

### 📋 Phase 4: Messaging
- [ ] WebSocket real-time chat
- [ ] Direct messages
- [ ] Read receipts
- [ ] "Message Seller" integration

### 📋 Phase 5: Project Logs
- [ ] Project creation
- [ ] Timeline updates
- [ ] Subscriptions
- [ ] Notifications

### 📋 Phase 6: Polish & Launch
- [ ] Admin/moderation tools
- [ ] SEO optimization
- [ ] Performance tuning
- [ ] Mobile responsiveness
- [ ] Security audit

---

## Database Abstraction Layer

AquaBook uses the **Repository Pattern** to abstract database operations. This allows easy migration between providers (Supabase → DigitalOcean → Self-hosted) without code changes.

### Example: Migrating from Supabase to Another Provider

```bash
# 1. Dump current database
pg_dump -h db.supabase.co -U postgres aquabook > backup.sql

# 2. Restore to new provider
psql -h new-provider.com -U postgres aquabook < backup.sql

# 3. Update .env
DATABASE_URL=postgresql://user:pass@new-provider.com/aquabook

# 4. Restart server
# NO CODE CHANGES NEEDED! 🎉
```

---

## Design System Usage

### Colors

```tsx
// Primary gradient (signature CTAs)
className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))]"

// Surface layers
className="bg-[hsl(var(--surface-container-lowest))]"  // White cards
className="bg-[hsl(var(--surface-container))]"         // Nested sections

// Text
className="text-[hsl(var(--on-surface))]"              // Primary text
className="text-[hsl(var(--on-surface-variant))]"     // Secondary text
```

### Components

```tsx
// Buttons (no dividers, full radius)
<button className="px-8 py-4 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-container))] text-white hover:shadow-lg hover:-translate-y-1 transition-all">
  Primary Action
</button>

// Cards (tonal lift, large radius)
<div className="bg-[hsl(var(--surface-container-lowest))] rounded-[var(--radius-lg)] p-8 shadow-[0_20px_40px_hsla(var(--on-surface)/0.06)]">
  Card Content
</div>

// Inputs (sunken aesthetic)
<input className="bg-[hsl(var(--surface-container-high))] rounded-[var(--radius-sm)] px-4 py-3 focus:bg-[hsl(var(--surface-container-lowest))]" />
```

### Typography

- **Headings**: 600 weight, `text-[hsl(var(--on-surface))]`
- **Body**: 400 weight, Plus Jakarta Sans
- **Metadata**: `text-[hsl(var(--on-surface-variant))]`

---

## Environment Variables

### Backend (.env)

```env
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=localhost:6379
JWT_SECRET=your-secret-key

S3_ENDPOINT=https://...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=aquabook

GOOGLE_CLIENT_ID=...
DISCORD_CLIENT_ID=...
FACEBOOK_CLIENT_ID=...
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT

---

## Contact

For questions or collaboration: [Your contact info]

Built with 🧡 for the aquarium hobby community
