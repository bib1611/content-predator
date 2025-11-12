# CONTENT PREDATOR - Complete Setup Guide

This guide walks you through setting up Content Predator from scratch. Follow every step.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Anthropic API key (get from [console.anthropic.com](https://console.anthropic.com))
- Supabase account (free tier works)

## Step 1: Supabase Setup (10 minutes)

### Create Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose organization, name it "content-predator"
4. Set a strong database password (save it somewhere)
5. Choose a region close to you
6. Wait 2-3 minutes for project to provision

### Get API Keys

1. Go to Project Settings > API
2. Copy these values (you'll need them):
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - anon/public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY) - **Keep this secret**

### Create Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Open the file `supabase-schema.sql` from this repo
3. Copy the entire contents
4. Paste into SQL Editor
5. Click "Run"
6. Verify tables were created: Go to Database > Tables
7. You should see:
   - content_opportunities
   - scan_history
   - generated_content

### Optional: Enable Authentication

For now, the app works without auth (local development). To add auth:

1. Go to Authentication > Providers
2. Enable Email provider
3. Turn off email confirmation for testing (Settings > Auth > Email Confirmation)
4. Create a test user manually or via signup flow

## Step 2: Anthropic API Setup (5 minutes)

### Get API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or login
3. Go to API Keys
4. Create a new key
5. Copy it immediately (you won't see it again)
6. Add credits to your account ($5-10 is enough to start)

### Check Rate Limits

Free tier:
- 50 requests per minute
- 40,000 tokens per day

That's enough for:
- 5-10 scans per day
- 30-50 content generations per day

## Step 3: Local Setup (5 minutes)

### Clone and Install

```bash
cd /path/to/content-predator
npm install
```

### Configure Environment Variables

1. Copy the example file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and fill in your values:
```bash
# Supabase (from Step 1)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Anthropic (from Step 2)
ANTHROPIC_API_KEY=sk-ant-your_key_here

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
DAILY_SCAN_LIMIT=5
```

3. Save the file

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see the Content Predator dashboard.

## Step 4: First Test Scan (10 minutes)

### Gather Data

1. Open X/Twitter in another tab
2. Copy your notifications (last 20-30 items)
3. Copy 5-10 posts from your timeline that are getting engagement
4. If you have Substack, copy recent comments/replies

### Run Scan

1. Click "HUNT FOR BLOOD" on dashboard
2. Paste your data into the fields
3. Click "RUN SCAN"
4. Wait 30-60 seconds for Claude to analyze
5. You should see "SCAN COMPLETE" with opportunities found

### Check Results

1. Go back to dashboard
2. See opportunities ranked by viral potential
3. Click "WEAPONIZE THIS" on any opportunity
4. Wait 10-20 seconds
5. Generated content appears below
6. Click "COPY" and test posting it

## Verification Checklist

✅ Supabase project created
✅ Database schema applied
✅ API keys configured in .env.local
✅ npm install completed
✅ npm run dev works
✅ Dashboard loads at localhost:3000
✅ First scan completes successfully
✅ Opportunities display on dashboard
✅ Content generation works
✅ Copy to clipboard works

## Common Issues

### "Missing Supabase environment variables"

**Problem**: .env.local not configured or not loaded
**Fix**:
- Check .env.local exists in root directory
- Verify all variables are filled in (no placeholders)
- Restart dev server: Ctrl+C then `npm run dev`

### "Failed to fetch opportunities"

**Problem**: Supabase RLS policies or schema not created
**Fix**:
- Go to Supabase SQL Editor
- Run `supabase-schema.sql` again
- Check Database > Tables shows all 3 tables
- Try logging in/out if using auth

### "Scan failed" / Claude API errors

**Problem**: Invalid API key or rate limit hit
**Fix**:
- Verify ANTHROPIC_API_KEY in .env.local
- Check [console.anthropic.com](https://console.anthropic.com) for API status
- Check credits in your Anthropic account
- Wait a minute if you hit rate limits

### "Daily limit reached"

**Problem**: Ran 5 scans today (default limit)
**Fix**:
- Wait until tomorrow (resets at midnight UTC)
- Or increase DAILY_SCAN_LIMIT in .env.local
- Check scan_history table in Supabase to see count

### TypeScript errors

**Problem**: Missing types or incorrect imports
**Fix**:
```bash
npm install
rm -rf .next
npm run dev
```

### Port 3000 already in use

**Problem**: Another app using port 3000
**Fix**:
- Kill other process: `lsof -ti:3000 | xargs kill`
- Or change port: `npm run dev -- -p 3001`

## Next Steps

### Daily Usage

1. Morning: Run 1-2 scans with fresh data
2. Review top 5-10 opportunities
3. Generate content for 3-5 best ones
4. Post to X/Substack
5. Mark used opportunities
6. Evening: Run 1 more scan if needed

### Optimize Workflow

1. Keep a text file with templates for common topics
2. Track which hooks perform best
3. Note time of day for best engagement
4. A/B test different CTAs
5. Adjust DAILY_SCAN_LIMIT based on budget

### Monitor Costs

Claude API costs roughly:
- $0.20 per scan (average)
- $0.07 per generation (average)
- $2-5 per day typical usage

Check usage at [console.anthropic.com](https://console.anthropic.com)

### Production Deployment

When ready to deploy to production:

1. Push code to GitHub
2. Deploy to Vercel: `vercel`
3. Add environment variables in Vercel dashboard
4. Update NEXT_PUBLIC_APP_URL to production URL
5. Test full flow in production
6. (Optional) Set up custom domain

## Support

Issues? Check:
1. This guide again (carefully)
2. README.md for troubleshooting
3. Console logs in browser dev tools
4. Supabase logs in dashboard
5. Anthropic API status page

---

Get it working. Then hunt for blood.
