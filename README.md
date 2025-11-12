# CONTENT PREDATOR

AI-powered content intelligence scanner for The Biblical Man brand. Hunt for viral opportunities on X/Twitter and Substack, analyze gaps in conversations, and generate confrontational content that drives engagement.

## Stack

- **Next.js 14+** with App Router
- **Supabase** for database and auth
- **Anthropic Claude API** for content analysis and generation
- **Tailwind CSS** for styling
- **TypeScript** for type safety

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Get your API keys from Project Settings > API

### 3. Set Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_key

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
DAILY_SCAN_LIMIT=5
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

### Manual Intelligence Gathering

Since X API costs $5000/month and Substack has no API, this uses a manual process:

1. Navigate to `/scan`
2. Copy-paste content from X notifications, timeline, and Substack comments
3. Claude analyzes and extracts opportunities
4. View ranked opportunities on dashboard

### Content Generation

Click "WEAPONIZE THIS" on any opportunity to generate:

- **Tweets**: Single confrontational posts (250 chars max)
- **Threads**: 6-8 tweet sequences with brutal truth-telling
- **Articles**: Substack outlines with hooks and CTAs

All content matches The Biblical Man voice:
- Confrontational, not soft
- Biblical truth that challenges comfortable Christianity
- Forces binary choices
- Visceral imagery and specific examples

### Opportunity Tracking

- Opportunities ranked by viral potential (1-10)
- Track which opportunities you've used
- View scan history and daily limits
- Copy generated content with one click

## File Structure

```
/app
  /api
    /scan          - Analyze social media data
    /generate      - Generate content from opportunities
    /opportunities - CRUD for opportunities
  /scan            - Manual data input page
  page.tsx         - Dashboard
  globals.css      - Brutal dark theme

/lib
  analyzer.ts      - Claude-powered content analysis
  generator.ts     - Content generation with templates
  supabase.ts      - Database client and types
```

## Usage Flow

1. **Daily Scan**: Run 1-2 scans per day (5 max per day to manage Claude API costs)
2. **Review**: Check dashboard for top opportunities (score 6+)
3. **Generate**: Click opportunities to generate content in preferred format
4. **Post**: Copy content and post to X/Substack manually
5. **Track**: Mark opportunities as "used" to avoid duplicates

## Brutal Design Philosophy

- Black background, white text, red accents
- No rounded corners or soft edges
- Aggressive copy ("HUNT FOR BLOOD" not "Run Scan")
- Direct error messages (no coddling)
- Desktop-optimized workflow

## API Costs

Claude API costs roughly:
- $0.15-0.30 per scan (depending on data volume)
- $0.05-0.10 per content generation
- ~$2-5 per day with 5 scans + 20 generations

Way cheaper than X API at $5000/month.

## Future Enhancements

- Chrome extension for easier data capture
- Performance tracking (manual input of engagement stats)
- A/B test different hooks and formats
- Content calendar integration
- Email digest of daily opportunities
- Automated posting (when budget allows)

## Security Notes

- All routes use Supabase RLS policies
- Daily scan limits enforced
- No platform credentials stored
- Input sanitization on all forms
- Service role key only used server-side

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` exists and has correct values
- Restart dev server after changing env vars

### "Daily limit reached"
- Wait until next day or increase `DAILY_SCAN_LIMIT` in `.env.local`
- Check scan history in Supabase dashboard

### "Scan failed"
- Verify Claude API key is correct
- Check that at least one data field has content
- Look at console for detailed error messages

### No opportunities showing
- Run a scan first from `/scan` page
- Check that opportunities have score >= 6
- Verify Supabase tables were created correctly

## Deploy

Deploy to Vercel:

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard.

## License

Proprietary. The Biblical Man brand.

---

Make the code as ruthless as the content it generates.
