# Auto-Scan Feature Guide

## Overview

The Auto-Scan feature enables **fully automated content discovery** from Twitter/X without any manual copy-pasting. It uses Browserbase (a headless browser service) to:

1. **Automatically search** Twitter for content in your niche (biblical masculinity, Christian men, etc.)
2. **Extract trending posts** with high engagement
3. **Analyze with Claude AI** to identify content opportunities
4. **Save to your dashboard** ready for weaponization

**No more manual work. Just click Auto-Scan and let AI hunt for you.**

---

## Setup Requirements

### 1. Browserbase Account

You need a Browserbase account to run automated browser sessions:

1. Go to [browserbase.com](https://www.browserbase.com) and sign up
2. Create a new project
3. Get your API key and Project ID from the dashboard

### 2. Environment Variables

Add these to your `.env.local` file:

```bash
# Browserbase Configuration
BROWSERBASE_API_KEY=bb_live_your_api_key_here
BROWSERBASE_PROJECT_ID=your_project_id_here
```

**Note:** Your API key has been provided: `bb_live_I7KVw_wVirOtlSazPn6TEHQ7W9o`

You still need to get your Project ID from Browserbase dashboard.

### 3. Verify Configuration

Check that auto-scan is configured correctly:

```bash
curl http://localhost:3000/api/auto-scan
```

Should return:
```json
{
  "configured": true,
  "browserbase_key": "Set",
  "browserbase_project": "Set",
  "status": "ready"
}
```

---

## How to Use Auto-Scan

### From Dashboard

1. Open Content Predator dashboard
2. Click the **"Auto-Scan (AI)"** button (purple button next to "Scan for Opportunities")
3. Wait 60-90 seconds for the scan to complete
4. New opportunities will appear in your dashboard automatically

### From API

You can also trigger auto-scan programmatically:

```bash
curl -X POST http://localhost:3000/api/auto-scan \
  -H "Content-Type: application/json" \
  -d '{}'
```

**With custom search queries:**

```bash
curl -X POST http://localhost:3000/api/auto-scan \
  -H "Content-Type: application/json" \
  -d '{
    "customQueries": [
      "biblical masculinity",
      "soft christianity crisis",
      "christian men weak"
    ]
  }'
```

---

## What Gets Scraped

### Default Search Keywords

The auto-scan searches for these topics by default:

- biblical masculinity
- christian men weakness
- soft christianity
- biblical manhood
- christian marriage
- masculine christianity

### Content Extracted

For each tweet found:

- **Tweet text** (full content)
- **Author** (username)
- **Engagement metrics** (likes, retweets, replies)
- **Timestamp**

The scraper collects up to **20 tweets per search** to avoid overwhelming the system.

---

## Technical Details

### Architecture

```
Dashboard (User clicks "Auto-Scan")
    ↓
/api/auto-scan endpoint
    ↓
Browserbase session initialized
    ↓
Playwright navigates to Twitter
    ↓
Scrape 20 tweets from search results
    ↓
Format scraped content
    ↓
Claude analyzes content (same as manual scan)
    ↓
Opportunities saved to database
    ↓
Browser session closed
    ↓
Results returned to dashboard
```

### Performance

- **Average duration:** 60-90 seconds
- **Cost per scan:**
  - Browserbase: ~$0.10 per session
  - Claude API: ~$0.20 per analysis
  - **Total:** ~$0.30 per auto-scan

### Rate Limits

Auto-scan counts toward your **daily scan limit** (default: 5 scans/day), just like manual scans.

---

## Customization

### Change Search Keywords

Edit `/lib/content-scraper.ts`:

```typescript
const TWITTER_SEARCH_KEYWORDS = [
  'your custom keyword 1',
  'your custom keyword 2',
  // Add more keywords here
];
```

### Change Number of Tweets Scraped

Edit `/lib/content-scraper.ts`:

```typescript
// Line ~45
const tweetsToProcess = tweets.slice(0, 20); // Change 20 to your desired number
```

### Add Substack Scraping

Currently, only Twitter is implemented. To add Substack:

1. Create a `scrapeSubstack()` function in `/lib/content-scraper.ts`
2. Call it in `/app/api/auto-scan/route.ts` alongside `scrapeTwitter()`
3. Merge results before analysis

---

## Troubleshooting

### "Auto-scan failed: BROWSERBASE_API_KEY is not set"

**Solution:** Add `BROWSERBASE_API_KEY` to your `.env.local` file and restart the dev server.

### "No content found during auto-scan"

**Possible causes:**

1. Twitter changed their HTML structure (selectors need updating)
2. Rate limiting by Twitter
3. Network issues with Browserbase

**Solutions:**

- Check Browserbase dashboard for session logs
- Try again in a few minutes
- Use manual scan as fallback

### "Daily limit reached"

**Solution:** Wait until tomorrow, or increase `DAILY_SCAN_LIMIT` in `.env.local`.

### Scraper returns empty tweets

**Problem:** Twitter's HTML structure changed.

**Solution:**

1. Go to Twitter search manually
2. Inspect a tweet element
3. Update selectors in `/lib/content-scraper.ts`:
   - `[data-testid="tweet"]` - main tweet container
   - `[data-testid="tweetText"]` - tweet text
   - `[data-testid="User-Name"]` - author username

---

## Cost Management

### Daily Budget Example

If you run **5 auto-scans per day**:

- Browserbase: $0.10 × 5 = $0.50/day
- Claude API: $0.20 × 5 = $1.00/day
- **Total:** $1.50/day = **$45/month**

Compare to Twitter API: **$5,000/month** 💀

### Reduce Costs

1. **Lower daily scan limit:**
   ```bash
   DAILY_SCAN_LIMIT=3  # in .env.local
   ```

2. **Run scans only when needed** (not scheduled)

3. **Increase tweet count per scan** to get more value per session:
   ```typescript
   const tweetsToProcess = tweets.slice(0, 50); // Get 50 instead of 20
   ```

---

## Scheduled Auto-Scans (Optional)

Want to run auto-scans automatically every morning?

### Option 1: Vercel Cron Jobs

1. Create `/app/api/cron/auto-scan/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Trigger auto-scan
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auto-scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

2. Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/auto-scan",
    "schedule": "0 8 * * *"
  }]
}
```

This runs auto-scan every day at 8 AM.

### Option 2: GitHub Actions

Create `.github/workflows/auto-scan.yml`:

```yaml
name: Daily Auto-Scan

on:
  schedule:
    - cron: '0 8 * * *'  # 8 AM daily

jobs:
  auto-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Auto-Scan
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/auto-scan \
            -H "Content-Type: application/json" \
            -d '{}'
```

---

## Security Considerations

### Browser Sessions

- Each session is **isolated** and runs in a clean environment
- No cookies or auth tokens are stored
- Sessions are **automatically closed** after scan completes

### API Keys

- Never commit `.env.local` to git (already gitignored)
- Store `BROWSERBASE_API_KEY` only in environment variables
- Rotate API keys periodically in Browserbase dashboard

### Rate Limiting

- Browserbase has built-in rate limiting
- Twitter may block excessive scraping from same IP
- Solution: Run scans 2-3 times per day max

---

## Next Steps

1. **Test the auto-scan** with the button on dashboard
2. **Review scraped opportunities** - are they relevant?
3. **Adjust search keywords** if needed (in `/lib/content-scraper.ts`)
4. **Set up scheduled scans** (optional) for daily automation
5. **Monitor costs** in Browserbase and Anthropic dashboards

---

## Support

Issues with auto-scan?

1. Check Browserbase session logs
2. Verify environment variables are set
3. Check browser console for errors
4. Review `/lib/content-scraper.ts` selectors

The auto-scan feature is **production-ready** but Twitter's HTML can change. If scraping breaks, update the selectors in the scraper file.

---

**Now go automate your content discovery. No more manual hunting.**
