# AquaBook - Technical Development Plan

## 1. Technology Stack

### Primary Stack: Go + React (Next.js)

**Backend: Go (Golang)**
Go is the right choice for AquaBook's backend. It offers excellent performance for concurrent operations (real-time messaging, marketplace queries, notifications), compiles to a single binary for easy deployment, and has a strong ecosystem for web services.

**Frontend: React (via Next.js)**
Next.js provides SSR/SSG for SEO (critical for marketplace listings and blog content being indexed by search engines), file-based routing, image optimization, and a mature ecosystem.

### Worthy Alternatives

| Component | Primary Choice | Alternative | Why Primary Wins for AquaBook |
|---|---|---|---|
| Backend | Go | Rust (Actix-web) | Go has faster development velocity for an MVP; Rust's learning curve slows iteration |
| Backend | Go | Elixir (Phoenix) | Phoenix LiveView is excellent for real-time, but smaller hiring pool and ecosystem |
| Frontend | Next.js (React) | SvelteKit | React's ecosystem is vastly larger; more component libraries for marketplace/social UIs |
| Frontend | Next.js (React) | Remix | Remix is solid but Next.js has stronger community, more deployment options, and better image optimization |

---

## 2. Architecture (MVP)

### Overview

```
┌─────────────────────────────────────────────────────┐
│                    CDN (Spaces CDN)                  │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Next.js Frontend (SSR)                  │
│            (DigitalOcean App Platform)               │
└──────────────────────┬──────────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────▼──────────────────────────────┐
│                Go API Server                         │
│              (Single Droplet/VM)                     │
│                                                      │
│  ┌─────────┐ ┌──────────┐ ┌────────────┐           │
│  │ REST API│ │WebSocket │ │ Background │           │
│  │ (Fiber) │ │ Server   │ │  Workers   │           │
│  └─────────┘ └──────────┘ └────────────┘           │
└──────┬──────────────┬───────────────┬───────────────┘
       │              │               │
┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
│ PostgreSQL  │ │   Redis   │ │ Object      │
│ (Managed)   │ │ (on VM)   │ │ Storage     │
│             │ │           │ │ (Spaces/S3) │
└─────────────┘ └───────────┘ └─────────────┘
```

### Design Principles for MVP
- **Monolithic Go backend** - single binary, single server. No microservices. Split later if needed.
- **PostgreSQL for everything** - relational data, full-text search (pg_trgm + tsvector), and geolocation queries (PostGIS) all in one database.
- **Redis for caching and sessions** - run on the same VM as the Go server for MVP.
- **Object storage for media** - images and videos go to S3-compatible storage (DigitalOcean Spaces or MinIO on Hetzner).
- **WebSockets for messaging** - gorilla/websocket in the Go server, no external service needed at MVP scale.

### Can It Run on Serverless Functions?

**Partially, but not recommended for MVP.**

| Component | Serverless Viable? | Notes |
|---|---|---|
| REST API | Yes (with caveats) | Cold starts hurt UX; connection pooling to DB is complex on serverless |
| WebSocket (messaging) | No | Serverless functions are stateless and short-lived; WebSockets need persistent connections |
| Background jobs | Partially | Good for image processing triggers, but cron-like jobs need a scheduler |
| Full app | No | The messaging/real-time features require a persistent server |

**Recommendation:** Use a single VM for the Go monolith. Serverless can be added later for specific tasks (image resizing, email sending, webhook processing) but the core app needs a persistent process for WebSocket connections and background workers.

---

## 3. Hosting Comparison

### DigitalOcean

| Resource | Spec | Cost/mo |
|---|---|---|
| Droplet (API server + Redis) | 2 GB RAM, 1 vCPU, 50 GB SSD | $12 |
| Managed PostgreSQL | 1 vCPU, 1 GB RAM, 10 GB disk | $15 |
| Spaces (media storage) | 250 GB storage + 1 TB CDN | $5 |
| **Total** | | **~$32/mo** |

**Pros:** Managed database removes ops burden, built-in CDN for Spaces, serverless functions available for future use (90k GiB-seconds free), good documentation, simple UI.
**Cons:** Most expensive of the three for MVP.

### Hetzner

| Resource | Spec | Cost/mo |
|---|---|---|
| CX22 VM (API + Redis + Postgres) | 2 vCPU, 4 GB RAM, 40 GB SSD | ~$4.50 |
| Second VM for DB (optional) | CPX11: 2 vCPU, 2 GB RAM | ~$5 |
| Object Storage | 1 TB storage + 1 TB egress | ~$5 |
| **Total** | | **~$10–15/mo** |

**Pros:** Cheapest option by far, 20 TB bandwidth included per server, excellent price-to-performance, EU data centers (GDPR-friendly), S3-compatible object storage.
**Cons:** No managed database (must self-host Postgres), no serverless functions, no built-in CDN (use Cloudflare free tier), more DevOps work required.

### AWS

| Resource | Spec | Cost/mo |
|---|---|---|
| EC2 t4g.micro (API server) | 2 vCPU, 1 GB RAM | ~$7 |
| RDS PostgreSQL (db.t4g.micro) | 1 vCPU, 1 GB RAM, 20 GB | ~$13 |
| S3 (50 GB) | Storage + requests | ~$2 |
| CloudFront CDN | 1 TB free (12 months) | $0 |
| **Total** | | **~$22/mo** |

**Pros:** Free tier for year 1 (~$1–5/mo), most services available (Lambda, SQS, SES, etc.), global CDN, best serverless ecosystem.
**Cons:** Pricing is complex/unpredictable, bandwidth is expensive ($0.09/GB after 100 GB free), vendor lock-in risk, overkill for MVP.

### Recommendation

| Factor | Winner | Reasoning |
|---|---|---|
| **Lowest cost** | **Hetzner** | $10–15/mo vs $22–37/mo |
| **Least ops work** | **DigitalOcean** | Managed DB + Spaces CDN + simple UI |
| **Best for scaling later** | **AWS** | Most services, global infrastructure |
| **Best for MVP** | **Hetzner** (if comfortable self-hosting DB) or **DigitalOcean** (if want managed services) | |

**For a cost-conscious MVP:** Start with **Hetzner** ($10–15/mo) — run Go server, Redis, and PostgreSQL on a single CX22 VM, media on Hetzner Object Storage, Cloudflare free tier for CDN/DDoS protection. Migrate to managed services when scale demands it.

**If you want less DevOps overhead:** Start with **DigitalOcean** ($32/mo) — managed Postgres, Spaces with CDN, simpler scaling path.

---

## 4. Libraries

### Backend (Go)

#### Web Framework

| Library | Stars | Pros | Cons |
|---|---|---|---|
| **Fiber** (gofiber/fiber) | ~39.5k | Express-like API, fastest Go framework (fasthttp), great middleware ecosystem, low memory footprint | Built on fasthttp (not net/http compatible), some net/http middleware won't work |
| Gin (gin-gonic/gin) | ~88.3k | Most popular Go framework, huge community, net/http compatible, well-documented | Slightly slower than Fiber, more verbose routing |
| Chi (go-chi/chi) | ~21.9k | Lightweight, idiomatic Go, net/http compatible, composable middleware | Minimal — less batteries-included, need more glue code |

**Recommendation:** **Fiber** — best DX for rapid MVP development, Express-like familiarity if coming from Node.js, excellent performance.

#### Database & Cache

| Library | Stars | Pros | Cons |
|---|---|---|---|
| **pgx** (jackc/pgx) | ~13.6k | Fastest Go Postgres driver, native Postgres types support, connection pooling built-in, LISTEN/NOTIFY support | Lower-level API than GORM, more SQL writing |
| **go-redis** (redis/go-redis) | ~22k | Full Redis feature coverage, pipeline support, Sentinel/Cluster support | Learning curve for advanced Redis patterns |

**Recommendation:** Use **pgx** directly (no ORM). For an MVP, writing SQL gives you full control over queries and avoids ORM overhead. Use **sqlc** (~13k stars) to generate type-safe Go code from SQL queries.

#### Authentication & Real-time

| Library | Stars | Pros | Cons |
|---|---|---|---|
| **golang-jwt/jwt** | ~9k | Standard JWT library for Go, well-maintained (successor to dgrijalva/jwt-go) | JWT-only; need to build auth flow around it |
| **gorilla/websocket** | ~24.6k | De facto Go WebSocket library, battle-tested, full RFC 6455 compliance | Project was briefly archived (now maintained again), no built-in pub/sub |

#### Media & Storage

| Library | Stars | Pros | Cons |
|---|---|---|---|
| **minio-go** | ~2.9k | S3-compatible client, works with DO Spaces/Hetzner/MinIO/AWS | Smaller community than AWS SDK |

#### Search (for later, post-MVP)

| Library | Stars | Pros | Cons |
|---|---|---|---|
| Meilisearch | ~56.9k | Easy setup, typo-tolerant, fast, great UI dashboard, RESTful API | Less customizable ranking than Typesense, younger project |
| Typesense | ~25.5k | Fast, typo-tolerant, good geo-search, curations/synonyms | Smaller community than Meilisearch |

**Recommendation for MVP:** Use PostgreSQL full-text search (free, no extra service). Migrate to **Meilisearch** when search becomes a core differentiator.

### Frontend (React/Next.js)

| Library | Stars | Pros | Cons |
|---|---|---|---|
| **Next.js** | ~139k | SSR/SSG for SEO, image optimization, file-based routing, API routes | Heavier than Vite for pure SPA, Vercel-optimized defaults |
| **TanStack Query** | ~49k | Server state management, caching, background refetching, optimistic updates | Learning curve for cache invalidation patterns |
| **Tailwind CSS** | ~94.3k | Utility-first, fast prototyping, consistent design, small bundle (purged) | Verbose class names, HTML can look cluttered |
| **shadcn/ui** | ~111k | Beautiful components, copy-paste (not npm dependency), fully customizable, built on Radix | Not a traditional component library — you own the code (pro and con) |
| **Leaflet** | ~44.8k | Free & open source maps, lightweight, huge plugin ecosystem | Less polished than Mapbox, no built-in geocoding |
| Mapbox GL JS | ~12.2k | Beautiful maps, geocoding API, 3D terrain, great DX | Paid after 50k loads/mo, proprietary |

**Recommendation:** **Leaflet** for marketplace location features (free, no API key required for tiles via OpenStreetMap). Switch to Mapbox if budget allows and premium map UX is needed.

#### Real-time (Alternative to self-hosted WebSocket)

| Library | Stars | Pros | Cons |
|---|---|---|---|
| Centrifugo | ~10.1k | Standalone real-time server, Go-native, WebSocket+SSE+HTTP streaming, scales independently | Extra service to deploy and maintain |
| NATS | ~19.5k | Ultra-lightweight messaging, pub/sub + request/reply, clustering built-in | More of a message broker than a client-facing WebSocket server |

**Recommendation for MVP:** Use **gorilla/websocket** directly in the Go server. Add Centrifugo when you need to scale real-time independently from the API.

---

## 5. Features

### 5.1 User System
- **Registration & Authentication**
  - Email/password signup with email verification
  - OAuth login (Google, Discord — aquarium communities are active on Discord)
  - JWT-based session management
  - Password reset flow
- **User Profiles**
  - Display name, avatar, bio
  - Location (city-level, for marketplace proximity)
  - List of tanks, projects, marketplace listings
  - Follower/following system
- **User Settings**
  - Notification preferences (email, push)
  - Privacy settings (profile visibility)
  - Account deletion

### 5.2 Tank Showcase
- **Tank Profiles**
  - Tank name, dimensions, volume (auto-calculated)
  - Tank type (freshwater, saltwater, planted, reef, brackish)
  - Equipment list (filter, heater, lighting, CO2, etc.)
  - Photo gallery (multiple images per tank)
  - Cover photo
- **Livestock & Plant Inventory**
  - Add fish species (common name, scientific name, quantity)
  - Add plant species (common name, scientific name)
  - Species auto-suggest from community database
  - Mark species as "active" or "removed"
- **Tank Feed**
  - Browse tanks by type, popularity, recent activity
  - Like/save tanks
  - Comments on tanks

### 5.3 Marketplace
- **Listings**
  - Title, description, photos (up to 10)
  - Category (fish, plants, equipment, full setups, other)
  - Condition (new, used — for equipment)
  - Price (fixed price, free/giveaway, negotiable)
  - Seller location
- **Discovery**
  - Search by keyword, category, price range
  - **Filter by distance** (miles/km radius from user location)
  - Sort by newest, price, distance
  - Saved searches with notifications
- **Listing Management**
  - Mark as sold/available/reserved
  - Bump listing
  - Edit/delete
- **Trust & Safety**
  - Seller ratings and reviews (after transaction)
  - Report listing
  - Basic scam detection (flagging suspicious listings)

### 5.4 Content & Blog
- **Blog Posts**
  - Rich text editor (Markdown-based)
  - Embed images and videos
  - Tags/categories (guides, tank builds, species spotlights, equipment reviews)
  - Draft/publish workflow
- **Video Sharing**
  - Upload short-form video (max 5 min for MVP) or embed YouTube/external links
  - Video thumbnails
  - Video comments
- **Content Feed**
  - Browse by category, popularity, recency
  - Like, comment, share/bookmark
  - Follow tags

### 5.5 Projects
- **Project Creation**
  - Project title, description, cover image
  - Project type (tank build, aquascape, breeding project, DIY equipment)
  - Status (active, completed, abandoned)
- **Project Updates**
  - Timeline-style updates with text, images, and video
  - Each update timestamped
  - Progress milestones
- **Subscriptions**
  - Subscribe to individual projects (without following the user)
  - Subscribe to a user (get all their project updates)
  - Notification when new update is posted
- **Project Feed**
  - Browse active/completed projects
  - Filter by type
  - Comments on updates

### 5.6 Messaging
- **Direct Messages**
  - 1-on-1 messaging between registered users
  - Real-time delivery via WebSocket
  - Message read receipts
  - Image sharing in messages
- **Marketplace Integration**
  - "Message Seller" button on listings
  - Conversation linked to listing context
- **Moderation**
  - Block/report users
  - Spam detection (rate limiting)

### 5.7 Notifications
- **In-App Notifications**
  - New comment on your tank/post/project
  - New follower
  - Marketplace: message from buyer, listing favorited
  - Project update from subscribed project
- **Email Notifications** (digest or real-time, user-configurable)

### 5.8 Admin & Moderation (MVP basics)
- **Content Moderation**
  - Report system (posts, comments, listings, users)
  - Admin dashboard to review reports
  - Content removal
- **User Management**
  - Ban/suspend users
  - View user activity

---

## 6. MVP Prioritization

### Phase 1 — Core (Weeks 1–6)
1. User registration/auth (email + OAuth)
2. User profiles
3. Tank showcase (CRUD, photos, fish/plant lists)
4. Basic feed (browse tanks)
5. Comments and likes

### Phase 2 — Marketplace & Messaging (Weeks 7–12)
1. Marketplace listings (CRUD, photos, categories)
2. Location-based search (PostGIS radius queries)
3. Direct messaging (WebSocket)
4. Marketplace-integrated messaging

### Phase 3 — Content & Projects (Weeks 13–18)
1. Blog/post system with rich text
2. Project creation and update timeline
3. Project subscriptions and notifications
4. Notification system (in-app + email)

### Phase 4 — Polish & Growth (Weeks 19–24)
1. Admin/moderation tools
2. Video uploads
3. Search improvements (full-text, filters)
4. Mobile responsiveness optimization
5. SEO optimization for marketplace and content
