import { Browserbase } from '@browserbasehq/sdk';
import { chromium } from 'playwright';

// Initialize Browserbase client
export function getBrowserbaseClient() {
  const apiKey = process.env.BROWSERBASE_API_KEY;

  if (!apiKey) {
    throw new Error('BROWSERBASE_API_KEY is not set in environment variables');
  }

  return new Browserbase({ apiKey });
}

// Create a browser session and return the connection details
export async function createBrowserSession() {
  const browserbase = getBrowserbaseClient();

  try {
    // Create a new session
    const session = await browserbase.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      // Don't keep session alive - let it close automatically when done
      // This prevents hitting concurrent session limits
    });

    return {
      sessionId: session.id,
      connectUrl: session.connectUrl,
    };
  } catch (error) {
    console.error('Failed to create Browserbase session:', error);
    throw error;
  }
}

// Connect to a Browserbase session with Playwright
export async function connectToBrowser(connectUrl: string) {
  try {
    const browser = await chromium.connectOverCDP(connectUrl);
    const context = browser.contexts()[0] || await browser.newContext();
    const page = context.pages()[0] || await context.newPage();

    return { browser, context, page };
  } catch (error) {
    console.error('Failed to connect to browser:', error);
    throw error;
  }
}

// Complete helper: create session and connect in one call
export async function initBrowserSession() {
  const { sessionId, connectUrl } = await createBrowserSession();
  const { browser, context, page } = await connectToBrowser(connectUrl);

  return {
    sessionId,
    browser,
    context,
    page,
  };
}

// Clean up browser session
export async function closeBrowserSession(browser: any, sessionId?: string) {
  try {
    await browser.close();

    // Note: Browserbase sessions auto-cleanup after keepAlive expires
    // The SDK doesn't have a stop() method, sessions end when browser closes
    if (sessionId) {
      console.log(`Browser session ${sessionId} closed - will auto-cleanup on Browserbase`);
    }
  } catch (error) {
    console.error('Failed to close browser session:', error);
  }
}
