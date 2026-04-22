# AquaFolks Blog - Complete Setup Guide

## ✅ What's Been Completed

I've created a complete marketing blog for AquaFolks using Next.js 16 and Sanity CMS. Here's what's ready:

### Architecture
- **Separate Next.js Site**: Independent from main app, runs on port 3002
- **Sanity CMS**: Headless CMS for content management
- **Integrated Studio**: Content editor at `/studio` route
- **SEO Optimized**: Proper metadata, Open Graph tags, ISR

### Features Implemented

#### Content Management ✅
- Blog posts with rich text editor
- Author profiles with bios
- Category/tag system
- Featured posts
- Image uploads with optimization
- Code syntax highlighting
- Draft/publish workflow

#### Pages Created ✅
1. **Homepage** (`/`) - Featured posts + recent posts
2. **Blog Listing** (`/blog`) - All posts with pagination
3. **Blog Post** (`/blog/[slug]`) - Individual post view
4. **Sanity Studio** (`/studio`) - Content editor

#### Technical Features ✅
- ISR (Incremental Static Regeneration) - 60s revalidate
- Image optimization via Sanity CDN
- Responsive design with Tailwind CSS
- TypeScript for type safety
- SEO metadata generation
- Static path generation for all posts

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Sanity Project

```bash
# Go to https://www.sanity.io/manage
# Sign up/login with GitHub
# Click "Create new project"
# Name: "AquaFolks Blog"
# Dataset: "production"
# Copy your Project ID
```

### Step 2: Update Environment Variables

Edit `/blog/.env.local`:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id-here  # ← Paste your ID
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

### Step 3: Start the Blog

```bash
cd /home/billyboar/Projects/aquafolks/blog
npm run dev
```

Visit:
- **Blog**: http://localhost:3002
- **Content Editor**: http://localhost:3002/studio

---

## 📝 Creating Your First Blog Post

### Method 1: Via Sanity Studio (Recommended)

1. Go to http://localhost:3002/studio
2. Sign in with your Sanity account
3. Click "Author" → Create your author profile first
4. Click "Category" → Create categories (e.g., "Beginner Guides", "Equipment")
5. Click "Post" → "Create new document"
6. Fill in:
   ```
   Title: "Getting Started with Your First Aquarium"
   Slug: Click "Generate" (creates URL-friendly version)
   Excerpt: "Everything you need to know..."
   Main Image: Upload a nice aquarium photo
   Body: Write your content (rich editor with images, code, etc.)
   Author: Select yourself
   Categories: Add 1-2 categories
   Featured: Check this to show on homepage
   Published At: Set date/time
   ```
7. Click "Publish"
8. View at http://localhost:3002/blog/getting-started-with-your-first-aquarium

### Method 2: Import Sample Content

I can help you create sample posts via API if needed!

---

## 🎨 Customization Guide

### Changing Colors/Branding

The blog uses Tailwind CSS. To match AquaFolks branding:

**Edit `blog/app/page.tsx`** - Change colors:
```typescript
// Find instances of:
"bg-blue-600"    → Your primary color
"text-blue-600"  → Your primary text color
"hover:bg-blue-700" → Your hover state
```

### Adding Navigation Header

Create `blog/components/Header.tsx`:
```typescript
export default function Header() {
  return (
    <header className="border-b bg-white">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <a href="/" className="text-2xl font-bold">AquaFolks</a>
        <div className="flex gap-6">
          <a href="/blog">Blog</a>
          <a href="http://localhost:3001">App</a>
        </div>
      </nav>
    </header>
  );
}
```

Then add to all pages:
```typescript
import Header from '@/components/Header';

// In page component:
<>
  <Header />
  {/* rest of page */}
</>
```

---

## 🌐 Production Deployment

### Option 1: Vercel (Recommended)

```bash
# 1. Push to GitHub
cd /home/billyboar/Projects/aquafolks/blog
git add .
git commit -m "Add marketing blog"
git push origin main

# 2. Go to vercel.com → Import project
# 3. Connect GitHub repo
# 4. Add environment variables:
NEXT_PUBLIC_SANITY_PROJECT_ID=your-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SITE_URL=https://blog.aquafolks.com

# 5. Deploy!
```

### Option 2: Self-Host

```bash
cd blog
npm run build
npm start  # Runs on port 3002
```

Use nginx/Apache to proxy:
```nginx
server {
    server_name blog.aquafolks.com;
    location / {
        proxy_pass http://localhost:3002;
    }
}
```

---

## 📊 Content Strategy Recommendations

### Blog Post Ideas

**Week 1-2: Beginner Content**
1. "Complete Guide to Starting Your First Aquarium"
2. "Top 10 Beginner-Friendly Fish Species"
3. "Understanding the Nitrogen Cycle"
4. "Essential Equipment for New Aquarists"

**Week 3-4: Intermediate**
5. "Aquascaping Basics: Creating Natural Layouts"
6. "Water Parameter Testing Guide"
7. "Common Fish Diseases and Treatments"
8. "Building a Low-Tech Planted Tank"

**Week 5-6: Advanced & Community**
9. "Breeding Angelfish: A Step-by-Step Guide"
10. "Community Spotlight: Amazing User Tanks"
11. "DIY CO2 System for Planted Tanks"
12. "Interview with Expert Aquascaper [Name]"

**Ongoing: Product & Updates**
- Equipment reviews
- AquaFolks feature announcements
- User success stories
- Seasonal tips

### SEO Tips

1. **Keywords**: Use aquarium-specific terms naturally
2. **Images**: Always add alt text
3. **Length**: Aim for 1000-2000 words for guides
4. **Links**: Link to main app features
5. **Consistency**: Post 2-3x per week initially

---

## 🔧 Common Customizations

### 1. Add Newsletter Signup

Install package:
```bash
npm install @sendgrid/mail
```

Add form to blog post bottom:
```typescript
<form className="mt-8 border p-6 rounded-lg">
  <h3 className="font-semibold mb-2">Subscribe to our newsletter</h3>
  <input type="email" placeholder="your@email.com" 
         className="border px-4 py-2 rounded mr-2" />
  <button className="bg-blue-600 text-white px-4 py-2 rounded">
    Subscribe
  </button>
</form>
```

### 2. Add Comments (via Disqus)

```bash
npm install disqus-react
```

Add to `blog/[slug]/page.tsx`:
```typescript
import { DiscussionEmbed } from 'disqus-react';

// In component:
<DiscussionEmbed
  shortname='aquafolks'
  config={{
    url: `https://blog.aquafolks.com/blog/${post.slug.current}`,
    identifier: post._id,
    title: post.title,
  }}
/>
```

### 3. Add Search

```bash
npm install fuse.js
```

Create search component that filters posts client-side or use Algolia for advanced search.

---

## 🐛 Troubleshooting

### "Cannot fetch posts" Error
```bash
# Check Sanity project ID is correct in .env.local
# Verify you have published posts in Sanity Studio
# Check network tab for CORS errors
```

### Studio Won't Load
```bash
# Clear browser cache
# Check if port 3002 is available
# Try: rm -rf .next && npm run dev
```

### Images Not Loading
```bash
# Verify images are uploaded in Sanity
# Check Sanity CDN URL is accessible
# Look for CORS issues in browser console
```

---

## 📈 Analytics Setup

### Add Google Analytics

1. Get GA4 Measurement ID
2. Install next analytics:
```bash
npm install @next/third-parties
```

3. Add to `blog/app/layout.tsx`:
```typescript
import { GoogleAnalytics } from '@next/third-parties/google'

export default function Layout({ children }) {
  return (
    <html>
      <body>{children}</body>
      <GoogleAnalytics gaId="G-XXXXXXXXXX" />
    </html>
  )
}
```

---

## 🎯 Next Steps

### Immediate (Do Now)
1. ✅ Create Sanity project
2. ✅ Update .env.local with project ID
3. ✅ Start dev server: `npm run dev`
4. ✅ Access studio: http://localhost:3002/studio
5. ✅ Create first author profile
6. ✅ Create 1-2 categories
7. ✅ Write and publish first blog post
8. ✅ Test on http://localhost:3002

### Short Term (This Week)
- Write 3-5 initial blog posts
- Set up custom domain
- Deploy to Vercel
- Add Google Analytics
- Create content calendar

### Long Term (This Month)
- Establish posting schedule
- Set up email newsletter
- Add social sharing buttons
- Implement related posts
- Create author pages
- Add RSS feed

---

## 📞 Need Help?

- **Sanity Docs**: https://www.sanity.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **My Email**: [Add support email]

---

## ✨ What Makes This Solution Great

1. **Zero vendor lock-in**: Content lives in Sanity, can export anytime
2. **Fast**: Sanity CDN + Next.js ISR = blazing fast pages
3. **SEO-friendly**: Server-side rendering, proper meta tags
4. **Scalable**: Free tier handles thousands of posts
5. **Editor-friendly**: Non-technical team can manage content
6. **Customizable**: Full control over design/features
7. **Integrated Studio**: No separate CMS login to remember

Good luck with your blog! 🚀
