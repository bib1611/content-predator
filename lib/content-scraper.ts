import { Page } from 'playwright';

export interface ScrapedContent {
  platform: 'twitter' | 'substack';
  content: string;
  author?: string;
  engagement?: string;
  url?: string;
  timestamp?: string;
}

// Twitter/X scraper configuration
const TWITTER_SEARCH_KEYWORDS = [
  'biblical masculinity',
  'christian men weakness',
  'soft christianity',
  'biblical manhood',
  'christian marriage',
  'masculine christianity',
];

/**
 * Scrape Twitter/X for trending content related to biblical masculinity
 * Note: This scrapes public content without authentication
 */
export async function scrapeTwitter(page: Page): Promise<ScrapedContent[]> {
  const scrapedContent: ScrapedContent[] = [];

  try {
    console.log('Starting Twitter scraping...');

    // Use Twitter search for public content (no login required)
    const searchQuery = TWITTER_SEARCH_KEYWORDS[0]; // Start with first keyword
    const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(searchQuery)}&src=typed_query&f=live`;

    console.log(`Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Extract tweets from the page
    // Twitter's structure: articles with data-testid="tweet"
    const tweets = await page.$$('[data-testid="tweet"]');
    console.log(`Found ${tweets.length} tweets`);

    // Limit to first 20 tweets to avoid overwhelming the system
    const tweetsToProcess = tweets.slice(0, 20);

    for (const tweet of tweetsToProcess) {
      try {
        // Extract tweet text
        const tweetTextElement = await tweet.$('[data-testid="tweetText"]');
        const tweetText = tweetTextElement
          ? await tweetTextElement.innerText()
          : '';

        // Extract author username
        const authorElement = await tweet.$('[data-testid="User-Name"]');
        const authorText = authorElement ? await authorElement.innerText() : '';

        // Extract engagement metrics (likes, retweets, etc.)
        const engagementElements = await tweet.$$('[role="group"] [data-testid$="count"]');
        let engagement = '';
        for (const el of engagementElements) {
          const text = await el.innerText();
          engagement += text + ' ';
        }

        if (tweetText && tweetText.length > 20) {
          scrapedContent.push({
            platform: 'twitter',
            content: tweetText,
            author: authorText,
            engagement: engagement.trim(),
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error extracting tweet:', error);
        continue;
      }
    }

    console.log(`Successfully scraped ${scrapedContent.length} tweets`);
  } catch (error) {
    console.error('Twitter scraping error:', error);
  }

  return scrapedContent;
}

/**
 * Scrape trending topics from Twitter's Explore page
 */
export async function scrapeTwitterTrending(page: Page): Promise<string[]> {
  const trendingTopics: string[] = [];

  try {
    console.log('Scraping Twitter trending topics...');

    await page.goto('https://twitter.com/explore/tabs/trending', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // Extract trending topic names
    const trendElements = await page.$$('[data-testid="trend"]');
    console.log(`Found ${trendElements.length} trends`);

    for (const trend of trendElements.slice(0, 10)) {
      try {
        const trendText = await trend.innerText();
        if (trendText) {
          trendingTopics.push(trendText);
        }
      } catch (error) {
        console.error('Error extracting trend:', error);
        continue;
      }
    }

    console.log(`Scraped ${trendingTopics.length} trending topics`);
  } catch (error) {
    console.error('Trending topics scraping error:', error);
  }

  return trendingTopics;
}

/**
 * Format scraped content into a structure compatible with the existing scan endpoint
 */
export function formatContentForScan(scrapedContent: ScrapedContent[]): {
  twitterData: string;
  substackData: string;
} {
  const twitterPosts = scrapedContent
    .filter((item) => item.platform === 'twitter')
    .map((item) => {
      const author = item.author ? `@${item.author}\n` : '';
      const engagement = item.engagement ? `[${item.engagement}]\n` : '';
      return `${author}${engagement}${item.content}\n---`;
    })
    .join('\n\n');

  const substackPosts = scrapedContent
    .filter((item) => item.platform === 'substack')
    .map((item) => {
      const author = item.author ? `By ${item.author}\n` : '';
      return `${author}${item.content}\n---`;
    })
    .join('\n\n');

  return {
    twitterData: twitterPosts || 'No Twitter content found',
    substackData: substackPosts || 'No Substack content found',
  };
}

/**
 * Search for specific accounts or hashtags
 */
export async function scrapeTwitterByQuery(
  page: Page,
  query: string
): Promise<ScrapedContent[]> {
  const scrapedContent: ScrapedContent[] = [];

  try {
    const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`;
    console.log(`Searching Twitter for: ${query}`);

    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const tweets = await page.$$('[data-testid="tweet"]');

    for (const tweet of tweets.slice(0, 15)) {
      try {
        const tweetTextElement = await tweet.$('[data-testid="tweetText"]');
        const tweetText = tweetTextElement
          ? await tweetTextElement.innerText()
          : '';

        if (tweetText && tweetText.length > 20) {
          scrapedContent.push({
            platform: 'twitter',
            content: tweetText,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error extracting tweet:', error);
        continue;
      }
    }

    console.log(`Scraped ${scrapedContent.length} tweets for query: ${query}`);
  } catch (error) {
    console.error(`Error scraping Twitter query "${query}":`, error);
  }

  return scrapedContent;
}
