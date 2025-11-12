# Content Predator - Quick Reference

## Essential Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Verify setup
node verify-setup.js

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## Project Structure

```
/app                    # Next.js app directory
  /api                  # API routes
    /scan              → POST: Analyze content, GET: Check limits
    /generate          → POST: Generate content
    /opportunities     → GET/PATCH/DELETE: Manage opportunities
  /scan                # Manual input page
  page.tsx             # Dashboard

/lib                    # Shared utilities
  analyzer.ts          # Claude content analysis
  generator.ts         # Content generation
  supabase.ts          # Database client
```

## Key URLs

**Development:**
- Dashboard: http://localhost:3000
- Scan Page: http://localhost:3000/scan

**External:**
- Supabase Dashboard: https://app.supabase.com
- Anthropic Console: https://console.anthropic.com
- Vercel Dashboard: https://vercel.com/dashboard

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key
ANTHROPIC_API_KEY=                # Claude API key
NEXT_PUBLIC_APP_URL=              # App URL (localhost or production)
DAILY_SCAN_LIMIT=5                # Max scans per day
```

## Database Tables

**content_opportunities**
- Stores identified opportunities
- Fields: platform, type, hook, angle, CTA, priority_score, used
- Index on: priority_score, date_scanned, used

**scan_history**
- Tracks all scan operations
- Fields: platforms_scanned, opportunities_found, duration, errors
- Index on: scan_date

**generated_content**
- Archives generated content
- Fields: opportunity_id, content_type, content, published
- Index on: opportunity_id

## API Endpoints

### POST /api/scan
```javascript
// Request
{
  notifications: string,
  trendingPosts: string,
  substackComments: string
}

// Response
{
  success: true,
  opportunities_found: 8,
  scan_duration: 45,
  opportunities: [...]
}
```

### POST /api/generate
```javascript
// Request
{
  opportunity: OpportunityAnalysis,
  format?: 'tweet' | 'thread' | 'article',
  regenerate?: boolean,
  feedback?: string
}

// Response
{
  success: true,
  content: {
    content: string,
    hook: string,
    cta: string,
    format: string
  }
}
```

### GET /api/opportunities
```javascript
// Query params: ?unused=true&limit=10&minScore=6

// Response
{
  success: true,
  count: 8,
  opportunities: [...]
}
```

## Common Tasks

### Run First Scan
1. Open http://localhost:3000/scan
2. Paste data into at least one field
3. Click "RUN SCAN"
4. Wait 30-60 seconds
5. Check dashboard for opportunities

### Generate Content
1. Go to dashboard
2. Find high-score opportunity (8-10)
3. Click "WEAPONIZE THIS"
4. Wait 10-30 seconds
5. Click "COPY"
6. Post to platform

### Check Scan Limits
```bash
# Via API
curl http://localhost:3000/api/scan

# Via Supabase
# Query scan_history table for today's scans
```

### Reset Daily Limit
```sql
-- In Supabase SQL Editor
DELETE FROM scan_history
WHERE scan_date >= CURRENT_DATE;
```

### View All Opportunities
```sql
-- In Supabase SQL Editor
SELECT
  priority_score,
  platform,
  opportunity_type,
  hook,
  used,
  date_scanned
FROM content_opportunities
ORDER BY priority_score DESC, date_scanned DESC
LIMIT 20;
```

## Troubleshooting

### App won't start
```bash
# Check Node version (need 18+)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for port conflicts
lsof -ti:3000 | xargs kill
```

### "Missing Supabase environment variables"
```bash
# Verify .env.local exists
ls -la .env.local

# Check contents
cat .env.local

# Restart dev server
npm run dev
```

### "Scan failed"
```bash
# Test Claude API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":100,"messages":[{"role":"user","content":"test"}]}'

# Check API usage
# Go to console.anthropic.com
```

### No opportunities showing
```bash
# Check database connection
# In Supabase SQL Editor:
SELECT COUNT(*) FROM content_opportunities WHERE used = false;

# Verify RLS policies are created
# Check Database > Policies in Supabase
```

## Cost Monitoring

**Check Claude Usage:**
1. Go to https://console.anthropic.com
2. Navigate to Usage
3. View current month spending

**Estimate Costs:**
- Scan = ~$0.20
- Generation = ~$0.07
- Daily limit of 5 scans = max $1.00/day
- 20 generations/day = ~$1.40/day
- Total: ~$2.40/day average

**Reduce Costs:**
- Lower DAILY_SCAN_LIMIT
- Use fewer scans per day
- Generate only for best opportunities (score 9-10)
- Batch similar opportunities

## Deployment Checklist

- [ ] Supabase project created
- [ ] Database schema applied
- [ ] RLS policies enabled
- [ ] API keys configured
- [ ] .env.local filled out
- [ ] Test scan successful
- [ ] Content generation working
- [ ] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Add env vars to Vercel
- [ ] Update NEXT_PUBLIC_APP_URL
- [ ] Test in production
- [ ] Monitor costs

## Performance Tips

**Speed up scans:**
- Paste less data (quality > quantity)
- Focus on most engaging posts
- Skip low-engagement content

**Better opportunities:**
- Include controversial topics
- Look for unanswered questions
- Note what format performs best
- Track patterns in high-score opportunities

**Optimize generation:**
- Use tweet format for speed (fastest)
- Use threads for depth
- Use articles for Substack only
- Regenerate with feedback if needed

## Support Resources

- Setup issues: See SETUP_GUIDE.md
- Voice/copy questions: See COPY_STYLE_GUIDE.md
- Technical overview: See PROJECT_SUMMARY.md
- General info: See README.md

## Keyboard Shortcuts

None implemented yet, but could add:
- Ctrl+K: Jump to scan page
- Ctrl+G: Generate from selected opportunity
- Ctrl+C: Copy generated content
- Ctrl+M: Mark as used

---

Keep this handy. You'll reference it daily.
