# AquaFolks Blog

Marketing blog for AquaFolks built with Next.js and Sanity CMS.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **Sanity CMS** - Headless CMS for content management
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Getting Started

### 1. Create a Sanity Project

1. Visit https://www.sanity.io/manage
2. Click "Create new project"
3. Name it "AquaFolks Blog"
4. Choose a dataset name (e.g., "production")
5. Copy your Project ID

### 2. Configure Environment Variables

Update `.env.local`:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id-here
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Initialize Sanity Studio

```bash
npx sanity init
```

When prompted:
- Select "Use existing project"
- Choose your project
- Use default dataset
- Set output path to `/` (current directory)

### 5. Deploy Sanity GraphQL API

```bash
npx sanity graphql deploy
```

### 6. Run Development Server

```bash
npm run dev
```

The blog will be available at:
- **Website**: http://localhost:3002
- **Sanity Studio**: http://localhost:3002/studio

## Content Management

### Accessing Sanity Studio

1. Navigate to http://localhost:3002/studio
2. Sign in with your Sanity account
3. Start creating content!

### Content Types

**Blog Post**
- Title, slug, excerpt
- Main image with alt text
- Rich text body with images, code blocks, links
- Author reference
- Categories
- Featured flag
- Published date

**Author**
- Name, slug
- Profile image
- Bio

**Category**
- Title, slug
- Description

### Creating Your First Post

1. Go to http://localhost:3002/studio
2. Click "Post" in the sidebar
3. Click "Create new document"
4. Fill in:
   - Title (e.g., "Getting Started with Aquariums")
   - Click "Generate" next to slug
   - Add excerpt for SEO
   - Upload a main image
   - Write your content in the body
   - Create or select an author
   - Add categories
   - Set published date
   - Check "Featured Post" if you want it on homepage
5. Click "Publish"
6. View your post at http://localhost:3002/blog/your-slug

## Project Structure

```
blog/
├── app/
│   ├── page.tsx              # Homepage with featured posts
│   ├── blog/
│   │   ├── page.tsx          # Blog listing page
│   │   └── [slug]/page.tsx   # Individual blog post
│   └── studio/
│       └── [[...tool]]/
│           └── page.tsx      # Sanity Studio
├── sanity/
│   └── schemas/
│       ├── post.ts           # Blog post schema
│       ├── author.ts         # Author schema
│       ├── category.ts       # Category schema
│       ├── blockContent.ts   # Rich text schema
│       └── index.ts          # Schema exports
├── lib/
│   └── sanity.ts             # Sanity client & queries
└── sanity.config.ts          # Sanity configuration
```

## Features

### Content Features
- ✅ Rich text editor with images, code blocks, links
- ✅ Image optimization with Sanity CDN
- ✅ SEO-friendly metadata
- ✅ Featured posts section
- ✅ Categories/tags
- ✅ Author profiles
- ✅ Draft/publish workflow

### Technical Features
- ✅ Server-side rendering with ISR (Incremental Static Regeneration)
- ✅ Automatic revalidation every 60 seconds
- ✅ Static page generation for all blog posts
- ✅ Responsive design
- ✅ SEO optimized
- ✅ Fast page loads with Next.js Image optimization

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - `NEXT_PUBLIC_SANITY_DATASET`
   - `NEXT_PUBLIC_SITE_URL` (your production URL)
4. Deploy!

### Deploy Sanity Studio

Sanity Studio is included in the Next.js app at `/studio`, so it deploys automatically with your site.

To use a custom domain for your studio:
1. Go to Vercel dashboard
2. Add domain (e.g., blog.aquafolks.com)
3. Access studio at https://blog.aquafolks.com/studio

## Custom Domain Setup

For production:

1. **Blog Site**: `blog.aquafolks.com` or `aquafolks.com/blog`
2. **Studio**: `blog.aquafolks.com/studio`
3. **Main App**: `app.aquafolks.com` or `aquafolks.com`

Update `.env.local` for production:
```bash
NEXT_PUBLIC_SITE_URL=https://blog.aquafolks.com
```

## Content Strategy

### Recommended Blog Topics

1. **Beginner Guides**
   - Getting started with your first aquarium
   - Choosing the right fish
   - Water parameters explained
   
2. **Advanced Guides**
   - Aquascaping techniques
   - Breeding specific species
   - DIY equipment builds

3. **Product Reviews**
   - Filter comparisons
   - Lighting reviews
   - Substrate guides

4. **Community Stories**
   - User tank showcases
   - Project spotlights
   - Success stories

5. **Company Updates**
   - New features
   - Platform updates
   - Community highlights

## Maintenance

### Updating Content

Content updates are real-time - just edit in Sanity Studio and changes appear on the site within 60 seconds (ISR revalidation period).

### Backup

Sanity automatically backs up your data. You can also export:

```bash
npx sanity dataset export production backup.tar.gz
```

## Support

- Sanity Docs: https://www.sanity.io/docs
- Next.js Docs: https://nextjs.org/docs
- AquaFolks Main App: http://localhost:3001
