# Get Started with Content Predator

Your MVP is built. Here's how to get it running in the next 30 minutes.

## 5-Minute Quick Start

If you already have Supabase and Anthropic accounts configured:

```bash
# 1. Navigate to project
cd /Users/thebi/content-predator

# 2. Install
npm install

# 3. Configure environment (edit with your real keys)
cp .env.local.example .env.local
# Edit .env.local with your keys

# 4. Start
npm run dev

# 5. Open
open http://localhost:3000
```

Done. Go hunt.

## 30-Minute Full Setup

No accounts yet? Follow these steps:

### Step 1: Supabase (10 min)

1. Go to https://supabase.com and sign up
2. Create new project called "content-predator"
3. Wait for provisioning (2-3 min)
4. Go to SQL Editor
5. Copy entire contents of `supabase-schema.sql`
6. Paste and click "Run"
7. Go to Settings > API, copy:
   - Project URL
   - anon key
   - service_role key

### Step 2: Anthropic (5 min)

1. Go to https://console.anthropic.com and sign up
2. Go to API Keys
3. Create new key
4. Copy it immediately
5. Add $10 credits to your account

### Step 3: Configure (2 min)

```bash
cd /Users/thebi/content-predator
cp .env.local.example .env.local
nano .env.local  # or use your editor
```

Paste your keys from Steps 1 and 2.

### Step 4: Install & Run (3 min)

```bash
npm install
npm run dev
```

### Step 5: Test (10 min)

1. Open http://localhost:3000
2. Click "HUNT FOR BLOOD"
3. Open X/Twitter in another tab
4. Copy your notifications
5. Copy 5-10 trending posts
6. Paste into form
7. Click "RUN SCAN"
8. Wait 45 seconds
9. See opportunities on dashboard
10. Click "WEAPONIZE THIS" on any opportunity
11. Copy and test the generated content

## What You Just Built

- Manual content intelligence scanner
- Claude AI-powered opportunity analysis
- Content generator for tweets, threads, and articles
- Brutal dark UI matching The Biblical Man brand
- Database for tracking opportunities and history
- Daily scan limits to manage costs

## What's Next

### Daily Workflow
1. Morning: Run scan with fresh data (5 min)
2. Review top 5 opportunities (2 min)
3. Generate content for best 2-3 (3 min)
4. Post to X/Substack (5 min)
5. Mark used opportunities (1 min)

Total: 15-20 min/day

### Week 1 Goals
- [ ] Run 3-5 scans
- [ ] Generate 10+ pieces of content
- [ ] Post at least 5 pieces
- [ ] Track which formats perform best
- [ ] Note which hooks get engagement

### Optimization
- Fine-tune prompts based on output quality
- Adjust scan frequency based on costs
- Track which opportunity types convert best
- Experiment with different CTA formats

## Costs to Expect

**Week 1**: $10-15 (testing and learning)
**Week 2+**: $5-10/week (optimized usage)
**Monthly**: $40-60 (5-10 scans + 20-30 generations/week)

Way cheaper than X API ($5000/month).

## Common Questions

**Q: Can I automate the scanning?**
A: Not in MVP. Chrome extension coming in Phase 2.

**Q: Can it auto-post to X?**
A: No. X API costs $5000/month. Manual posting works fine.

**Q: What if I run out of scans?**
A: Increase DAILY_SCAN_LIMIT in .env.local or wait until tomorrow.

**Q: Can multiple people use it?**
A: Not yet. Single user for now. Multi-user in Phase 2.

**Q: How do I deploy to production?**
A: `vercel` command. See SETUP_GUIDE.md for details.

## Documentation

- **README.md** - Overview and features
- **SETUP_GUIDE.md** - Detailed setup instructions
- **PROJECT_SUMMARY.md** - Technical details
- **COPY_STYLE_GUIDE.md** - Voice and tone guide
- **QUICK_REFERENCE.md** - Commands and tips
- **This file** - Get started fast

## Support

Something broken?

1. Run `node verify-setup.js` to check configuration
2. Check QUICK_REFERENCE.md for common issues
3. Read error messages (they're direct)
4. Check browser console for details
5. Review Supabase logs
6. File issue on GitHub

## Next Features (Your Choice)

Vote for Phase 2 features:
- [ ] Chrome extension for data capture
- [ ] Performance tracking (engagement metrics)
- [ ] A/B testing different hooks
- [ ] Content calendar integration
- [ ] Email digest of opportunities
- [ ] Multi-user support
- [ ] Automated posting (if budget allows)

## Ship It

You have a working MVP. Configure it. Test it. Use it daily.

Stop reading docs. Go hunt for blood.

---

Project location: /Users/thebi/content-predator
Start command: npm run dev
Dashboard: http://localhost:3000
