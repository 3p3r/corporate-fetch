import * as puppeteer from 'puppeteer';
import rc from 'rc';
import debug from 'debug';

const log = debug('corporate-fetch');

interface CorporateFetchConfig {
  timeout?: number;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  headless?: boolean;
}

const config: CorporateFetchConfig = rc('corporate-fetch', {
  timeout: 30000,
  userAgent: 'Mozilla/5.0 (compatible; corporate-fetch)',
  viewport: { width: 1920, height: 1080 },
  headless: true,
});

interface EvaluatedResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  text: string;
  url: string;
}

/**
 * Corporate fetch - A drop-in replacement for fetch that proxies requests through Puppeteer
 * @param input - URL or Request object
 * @param init - RequestInit options
 * @param page - Puppeteer Page instance (optional, will create one if not provided)
 * @returns Promise<Response>
 */
async function corporateFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  page?: puppeteer.Page
): Promise<Response> {
  log('Starting corporate fetch for:', input);

  let ownPage = false;
  let browser: puppeteer.Browser | undefined;

  try {
    // If no page provided, create a browser and page
    if (!page) {
      log('No page provided, launching browser');
      browser = await puppeteer.launch({
        headless: config.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      page = await browser.newPage();
      ownPage = true;
    }

    // Set viewport and user agent
    await page.setViewport(config.viewport!);
    await page.setUserAgent(config.userAgent!);

    // Parse the request
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = init?.method || 'GET';
    const headers = init?.headers || {};
    const body = init?.body;

    log('Making request:', { url, method, headers });

    // Set extra headers if provided
    if (headers) {
      let headerObj: Record<string, string> = {};

      if (headers instanceof Headers) {
        headers.forEach((value, key) => {
          headerObj[key] = value;
        });
      } else if (typeof headers === 'object') {
        headerObj = headers as Record<string, string>;
      }

      await page.setExtraHTTPHeaders(headerObj);
    }

    // Handle different HTTP methods
    if (method.toUpperCase() === 'GET') {
      const response = await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: config.timeout,
      });

      if (!response) {
        throw new Error('Failed to get response from page');
      }

      const responseText = await page.content();
      const responseHeaders = response.headers();
      const status = response.status();
      const statusText = response.statusText();

      log('Response received:', { status, statusText });

      // Create a fetch-compatible Response object
      return new Response(responseText, {
        status,
        statusText,
        headers: responseHeaders,
      });
    } else {
      // For non-GET requests, use page.evaluate to make fetch request
      const evaluatedResponse: EvaluatedResponse = await page.evaluate(
        async (url: string, options: any) => {
          const resp = await fetch(url, options);
          const headers: Record<string, string> = {};
          resp.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            status: resp.status,
            statusText: resp.statusText,
            headers: headers,
            text: await resp.text(),
            url: resp.url,
          };
        },
        url,
        { method, body, headers }
      );

      log('Response received:', {
        status: evaluatedResponse.status,
        statusText: evaluatedResponse.statusText,
      });

      // Create a fetch-compatible Response object
      return new Response(evaluatedResponse.text, {
        status: evaluatedResponse.status,
        statusText: evaluatedResponse.statusText,
        headers: evaluatedResponse.headers,
      });
    }
  } catch (error) {
    log('Error during fetch:', error);
    throw error;
  } finally {
    // Clean up if we created our own browser
    if (ownPage && browser) {
      log('Closing browser');
      await browser.close();
    }
  }
}

export default corporateFetch;
export { corporateFetch, CorporateFetchConfig };
