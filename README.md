# corporate-fetch

"fetch" designed to run in corporate environments, through your corporate browser!

A drop-in replacement for the standard `fetch` API that proxies requests through a Puppeteer-controlled browser. This is useful in corporate environments where direct HTTP requests might be blocked but browser requests work through corporate proxies.

## Installation

```bash
npm install corporate-fetch
```

## Usage

### Basic Usage

```javascript
const corporateFetch = require('corporate-fetch');

// Use it just like regular fetch
const response = await corporateFetch('https://api.example.com/data');
const data = await response.json();
```

### With Options

```javascript
const corporateFetch = require('corporate-fetch');

const response = await corporateFetch('https://api.example.com/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ key: 'value' })
});
```

### With Custom Puppeteer Page

```javascript
const corporateFetch = require('corporate-fetch');
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch();
const page = await browser.newPage();

// Use your own page instance for better control
const response = await corporateFetch('https://api.example.com/data', {}, page);

await browser.close();
```

## Configuration

You can configure corporate-fetch using an RC file (`.corporate-fetchrc`) in your project root:

```json
{
  "timeout": 30000,
  "userAgent": "Mozilla/5.0 (compatible; corporate-fetch)",
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "headless": true
}
```

## Features

- Drop-in replacement for standard `fetch` API
- Automatic browser management (launches and closes browser if not provided)
- Support for custom Puppeteer page instances
- Configurable via RC files
- Debug logging via the `debug` package (use `DEBUG=corporate-fetch`)
- TypeScript support included

## API

### corporateFetch(input, init?, page?)

- `input`: URL string, URL object, or Request object
- `init` (optional): RequestInit options (method, headers, body, etc.)
- `page` (optional): Puppeteer Page instance

Returns a Promise that resolves to a standard Response object.

## License

ISC
