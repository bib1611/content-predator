# Deployment Guide - Content Predator

## Quick Deploy to Vercel (Recommended - 5 minutes)

Vercel is the easiest way to deploy Next.js apps. It's free for hobby projects and handles everything automatically.

### Step 1: Push Your Code (Already Done ✓)

Your code is already pushed to:
- Branch: `claude/agentic-browser-integration-011CV55rd7uikDThj2b8DUEj`
- Repo: `bib1611/content-predator`

### Step 2: Create Pull Request

Go to: https://github.com/bib1611/content-predator/pull/new/claude/agentic-browser-integration-011CV55rd7uikDThj2b8DUEj

Or merge directly to main if you want to deploy immediately.

### Step 3: Deploy to Vercel

#### Option A: Deploy from GitHub

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import `bib1611/content-predator` repository
4. Select branch (either merge to main first, or deploy the feature branch)
5. Click "Deploy"

#### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from your local machine, not this environment)
vercel

# Follow prompts:
# - Link to existing project? No (first time) or Yes (if exists)
# - Project name: content-predator
# - Directory: ./
# - Override settings? No

# Deploy to production
vercel --prod
```

### Step 4: Add Environment Variables in Vercel

After deploying, you MUST add these environment variables in Vercel dashboard:

1. Go to your project in Vercel
2. Click "Settings" → "Environment Variables"
3. Add each variable:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key

# Browserbase (for auto-scan)
BROWSERBASE_API_KEY=bb_live_I7KVw_wVirOtlSazPn6TEHQ7W9o
BROWSERBASE_PROJECT_ID=bea66734-814e-4067-8792-667cfab5af61

# App Settings
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
DAILY_SCAN_LIMIT=5
```

4. After adding variables, click "Redeploy" to apply them

### Step 5: Test Auto-Scan

1. Visit your deployed URL: `https://your-app.vercel.app`
2. Click the purple **"Auto-Scan (AI)"** button
3. Wait 60-90 seconds
4. See automated content opportunities appear!

---

## Alternative: Deploy to Other Platforms

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

Add environment variables in Netlify dashboard under "Site settings" → "Environment variables".

### Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `bib1611/content-predator`
5. Add environment variables in settings
6. Deploy

### Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Pages → "Create a project"
3. Connect to GitHub: `bib1611/content-predator`
4. Build settings:
   - Framework preset: Next.js
   - Build command: `npm run build`
   - Build output: `.next`
5. Add environment variables
6. Deploy

---

## Deployment Checklist

Before deploying, ensure you have:

- ✅ Pushed code to GitHub
- ✅ Supabase project created and schema applied
- ✅ Anthropic API key with credits
- ✅ Browserbase account with project created
- ✅ All environment variables ready

After deploying:

- ✅ Add all environment variables in hosting dashboard
- ✅ Redeploy after adding variables
- ✅ Test the app loads
- ✅ Test manual scan works
- ✅ Test auto-scan works
- ✅ Check Supabase connection
- ✅ Verify opportunities save to database

---

## Troubleshooting Deployment

### "Missing environment variables"

**Solution:** Double-check all variables are added in your hosting dashboard, then redeploy.

### "Failed to fetch opportunities"

**Solution:**
1. Check Supabase URL and keys are correct
2. Verify database schema is applied
3. Check RLS policies in Supabase

### "Auto-scan failed"

**Solution:**
1. Verify `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` are set
2. Check Browserbase dashboard for session logs
3. Ensure you have credits in Browserbase account

### Build fails

**Solution:**
```bash
# Test build locally first
npm run build

# If it builds locally but fails in production:
# - Check Node.js version in hosting settings (should be 18+)
# - Verify all dependencies are in package.json
# - Check build logs for specific errors
```

### "API routes not working"

**Solution:**
- Ensure you're using a platform that supports Next.js API routes
- Vercel, Netlify, and Railway all support this
- Static hosts (like GitHub Pages) do NOT support API routes

---

## Cost Estimate for Production

### Monthly costs for moderate usage (5 scans/day):

- **Vercel:** Free (hobby tier supports this easily)
- **Supabase:** Free (up to 500MB database, 2GB bandwidth)
- **Anthropic API:** ~$60-90/month
  - Manual scans: ~$0.20 each × 5/day = $30/month
  - Auto-scans: ~$0.20 each (Claude only, not including Browserbase)
- **Browserbase:** ~$15-30/month
  - ~$0.10 per session × 5/day × 30 days = $15/month

**Total: ~$75-120/month** (compare to Twitter API: $5,000/month)

---

## Next Steps After Deployment

1. **Test all features** in production
2. **Share the URL** with your team
3. **Set up monitoring** (Vercel/Netlify have built-in analytics)
4. **Create a custom domain** (optional)
5. **Set up scheduled auto-scans** (see AUTO_SCAN_GUIDE.md)

---

Ready to deploy? Start with Vercel - it's the fastest path to getting your auto-scan feature live!
