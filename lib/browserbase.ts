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
      // Keep session alive for 30 minutes max
      keepAlive: true,
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

    // Optionally stop the session on Browserbase
    if (sessionId) {
      const browserbase = getBrowserbaseClient();
      await browserbase.sessions.stop(sessionId);
    }
  } catch (error) {
    console.error('Failed to close browser session:', error);
  }
}
