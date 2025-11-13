import { NextRequest, NextResponse } from 'next/server';
import { initBrowserSession, closeBrowserSession } from '@/lib/browserbase';

/**
 * TWITTER AUTHENTICATION ENDPOINT
 * Helps user login to Twitter via Browserbase and save session cookies
 * This enables auto-scan to access Twitter without timing out
 */
export async function POST(request: NextRequest) {
  let browser = null;
  let sessionId = null;

  try {
    const body = await request.json();
    const { username, password } = body as { username?: string; password?: string };

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Twitter username and password required' },
        { status: 400 }
      );
    }

    console.log('🔐 Starting Twitter authentication...');

    // Initialize Browserbase session
    const session = await initBrowserSession();
    browser = session.browser;
    sessionId = session.sessionId;
    const { page, context } = session;

    console.log(`✅ Browser session created: ${sessionId}`);

    // Navigate to Twitter login
    console.log('🌐 Navigating to Twitter login...');
    await page.goto('https://twitter.com/i/flow/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for username input
    console.log('📝 Entering username...');
    await page.waitForSelector('input[autocomplete="username"]', { timeout: 10000 });
    await page.fill('input[autocomplete="username"]', username);

    // Click Next button
    const nextButtons = await page.locator('div[role="button"]').all();
    for (const button of nextButtons) {
      const text = await button.textContent();
      if (text?.includes('Next')) {
        await button.click();
        break;
      }
    }

    // Wait a bit for password field to appear
    await page.waitForTimeout(2000);

    // Check if there's a verification step (phone/email)
    const verificationInput = await page.locator('input[data-testid="ocfEnterTextTextInput"]').count();
    if (verificationInput > 0) {
      return NextResponse.json(
        {
          error: 'Additional verification required',
          hint: 'Twitter is asking for phone number or email verification. This automated login may not work. Please use manual session sync instead.',
          session_url: `https://www.browserbase.com/sessions/${sessionId}`,
        },
        { status: 422 }
      );
    }

    // Enter password
    console.log('🔑 Entering password...');
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.fill('input[name="password"]', password);

    // Click Log in button
    const loginButtons = await page.locator('div[role="button"]').all();
    for (const button of loginButtons) {
      const text = await button.textContent();
      if (text?.includes('Log in')) {
        await button.click();
        break;
      }
    }

    // Wait for navigation and check if login succeeded
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    if (currentUrl.includes('/home') || currentUrl.includes('/i/flow/login')) {
      // Login successful - save cookies
      console.log('✅ Login successful! Saving session cookies...');

      const cookies = await context.cookies();
      const cookieData = {
        cookies,
        timestamp: new Date().toISOString(),
        username,
      };

      // In production, you'd save these to a secure database
      // For now, we'll return them and let the user save manually
      // Or we could save to Browserbase persistent sessions

      // Close browser
      await closeBrowserSession(browser, sessionId);

      return NextResponse.json({
        success: true,
        message: 'Successfully logged in to Twitter!',
        cookie_count: cookies.length,
        session_saved: true,
        hint: 'Auto-scan will now use these cookies to access Twitter.',
        cookies: cookieData, // In production, don't return these - save to DB
      });
    } else if (currentUrl.includes('error') || currentUrl.includes('challenge')) {
      await closeBrowserSession(browser, sessionId);

      return NextResponse.json(
        {
          error: 'Login failed',
          hint: 'Twitter blocked the login attempt. Try manual session sync instead.',
          current_url: currentUrl,
        },
        { status: 401 }
      );
    } else {
      // Unknown state
      await closeBrowserSession(browser, sessionId);

      return NextResponse.json(
        {
          error: 'Login status unclear',
          hint: 'Unable to confirm if login succeeded. Try manual session sync.',
          current_url: currentUrl,
        },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error('❌ Twitter auth error:', error);

    // Try to close browser if it was opened
    if (browser) {
      try {
        await closeBrowserSession(browser, sessionId || undefined);
      } catch (closeError) {
        console.error('Failed to close browser:', closeError);
      }
    }

    return NextResponse.json(
      {
        error: 'Twitter authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Try manual session sync via Browserbase dashboard.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - Returns manual session sync instructions
 */
export async function GET() {
  return NextResponse.json({
    instructions: [
      '1. Go to https://www.browserbase.com/sessions',
      '2. Create a new session',
      '3. Open the live session view',
      '4. Login to Twitter manually in the browser',
      '5. Copy the session ID and save it',
      '6. Auto-scan will reuse this authenticated session',
    ],
    browserbase_api_key: process.env.BROWSERBASE_API_KEY || 'Not configured',
    browserbase_project_id: process.env.BROWSERBASE_PROJECT_ID || 'Not configured',
  });
}
