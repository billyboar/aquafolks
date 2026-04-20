# Production Optimization TODO

This document tracks important tasks that must be completed before deploying AquaFolks to production.

## High Priority - Image Optimization

### 1. Remove `unoptimized` prop from Next.js Images
**Status:** Pending  
**Priority:** High

Currently, all `<Image>` components use the `unoptimized` prop to bypass Next.js image optimization. This works for development but is not recommended for production.

**Files to update:**
- `/frontend/app/tanks/[id]/page.tsx`
- `/frontend/app/explore/page.tsx`
- `/frontend/app/tanks/page.tsx`
- `/frontend/app/users/[id]/page.tsx`

**Action:** Remove `unoptimized` prop from all Image components after proper image serving is configured.

### 2. Configure MinIO with Proper Domain
**Status:** Pending  
**Priority:** High

Currently using `localhost:9000` for MinIO which only works in development.

**Options:**
- Set up MinIO behind reverse proxy (nginx/caddy) with proper domain
- Use subdomain like `cdn.aquafolks.com` or `storage.aquafolks.com`
- Enable HTTPS/SSL for secure image serving
- Configure proper CORS headers for production domain

**Action Items:**
- [ ] Choose domain/subdomain for object storage
- [ ] Set up reverse proxy for MinIO
- [ ] Configure SSL certificates
- [ ] Update CORS configuration
- [ ] Update backend `.env` with production MinIO endpoint
- [ ] Update Next.js `next.config.ts` with production image domain

### 3. Set up Production Image Serving Strategy
**Status:** Pending  
**Priority:** High

Choose and implement one of the following strategies:

**Option A: Next.js Image Proxy + MinIO**
- Pros: Simple, uses Next.js built-in optimization
- Cons: Optimization happens on-demand, can be slower first load
- Configuration: Update `remotePatterns` in `next.config.ts`

**Option B: CDN + MinIO**
- Pros: Fast global delivery, caching at edge
- Cons: Additional service/cost
- Options: CloudFront, Cloudflare, Vercel CDN

**Option C: External Image Service**
- Pros: Advanced features (smart cropping, format conversion)
- Cons: Additional cost, vendor lock-in
- Options: Cloudinary, imgix, Uploadcare

**Recommended:** Option A for initial launch, migrate to Option B as traffic grows.

## Medium Priority - Performance Optimization

### 4. Add Image Compression and WebP Conversion
**Status:** Pending  
**Priority:** Medium

Automatically convert uploaded images to WebP format for better compression.

**Action Items:**
- [ ] Add image processing library to backend (e.g., `imaging`, `bimg`)
- [ ] Create WebP variants on upload
- [ ] Serve WebP to supported browsers, fallback to original format
- [ ] Consider generating multiple sizes for responsive images

### 5. Implement Lazy Loading for Image Galleries
**Status:** Pending  
**Priority:** Medium

Improve initial page load by lazy loading images in galleries.

**Action Items:**
- [ ] Add `loading="lazy"` to non-critical images
- [ ] Implement intersection observer for advanced lazy loading
- [ ] Add skeleton loaders for better UX during image load
- [ ] Consider virtual scrolling for large tank collections

## Additional Production Considerations

### Security
- [ ] Validate file types and sizes on upload
- [ ] Scan uploaded images for malicious content
- [ ] Implement rate limiting on upload endpoints
- [ ] Add file size limits (currently unlimited)

### Monitoring
- [ ] Set up monitoring for MinIO storage usage
- [ ] Track image load performance
- [ ] Monitor failed image loads
- [ ] Set up alerts for storage quotas

### Database
- [ ] Add indexes on frequently queried columns
- [ ] Set up database backups
- [ ] Configure connection pooling for production load
- [ ] Consider read replicas for better performance

### Backend
- [ ] Add request rate limiting
- [ ] Set up proper logging and monitoring
- [ ] Configure production-grade error handling
- [ ] Set up health checks and alerts
- [ ] Use proper secrets management (not .env files)

### Frontend
- [ ] Enable production builds and optimizations
- [ ] Configure proper caching headers
- [ ] Add analytics and error tracking
- [ ] Implement proper SEO metadata
- [ ] Add loading states and error boundaries

## Timeline Recommendation

**Before Beta Launch:**
- Complete all High Priority items
- Security validations for file uploads
- Basic monitoring setup

**Before Public Launch:**
- Complete all Medium Priority items
- Full monitoring and alerting
- Performance optimization
- Load testing

## Notes

- Current development setup uses `localhost:9000` for MinIO
- All images currently bypass Next.js optimization with `unoptimized` prop
- Backend server: Go/Fiber on port 3000
- Frontend: Next.js 16.2.2 with Turbopack on port 3001
- MinIO Console: localhost:9001

Last Updated: 2026-04-07
