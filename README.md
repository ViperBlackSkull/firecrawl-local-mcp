# Firecrawl Local MCP Server

An MCP (Model Context Protocol) server for interacting with a self-hosted Firecrawl instance. This server provides web scraping and crawling capabilities through your local Firecrawl deployment.

## Features

- **Web Scraping**: Extract content from single web pages in markdown format
- **Web Crawling**: Crawl entire websites with customizable depth and filtering
- **Site Mapping**: Generate lists of all accessible URLs on a website
- **Job Monitoring**: Track the status of crawling jobs
- **No API Key Required**: Works directly with self-hosted Firecrawl instances

## Installation

```bash
npm install
npm run build
```

## Configuration

The server is pre-configured to connect to a Firecrawl instance at `http://192.168.1.210:3002`.

To change the Firecrawl URL, modify the `baseURL` in `src/index.ts`:

```typescript
const firecrawl = new FirecrawlLocalClient("http://your-firecrawl-host:3002");
```

## Usage

### As an MCP Server

Add this to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "firecrawl-local": {
      "command": "node",
      "args": ["/path/to/firecrawl-local-mcp/dist/index.js"]
    }
  }
}
```

### Available Tools

#### firecrawl_scrape
Scrape a single webpage and return its content in markdown format.

**Parameters:**
- `url` (required): The URL to scrape
- `formats`: Output formats (default: ["markdown"])
- `onlyMainContent`: Extract only main content (default: true)
- `includeTags`: HTML tags to include
- `excludeTags`: HTML tags to exclude

#### firecrawl_crawl
Crawl a website starting from a URL and return content from multiple pages.

**Parameters:**
- `url` (required): The starting URL to crawl
- `includes`: URL patterns to include (supports wildcards)
- `excludes`: URL patterns to exclude (supports wildcards)
- `maxDepth`: Maximum crawl depth (default: 2)
- `limit`: Maximum number of pages to crawl (default: 10)
- `allowBackwardLinks`: Allow crawling backward links (default: false)
- `allowExternalLinks`: Allow crawling external links (default: false)

#### firecrawl_crawl_status
Check the status of a crawl job.

**Parameters:**
- `jobId` (required): The job ID returned from a crawl request

#### firecrawl_map
Map a website to get a list of all accessible URLs.

**Parameters:**
- `url` (required): The URL to map
- `search`: Search query to filter URLs
- `ignoreSitemap`: Ignore the website's sitemap (default: false)
- `includeSubdomains`: Include subdomains (default: false)
- `limit`: Maximum number of URLs to return (default: 5000)

## Testing

Test the server functionality:

```bash
node test.js
```

This will test both the tool listing and a sample scrape operation.

## Example Usage

Once configured in Claude Desktop, you can use natural language commands like:

- "Scrape the content from https://example.com"
- "Crawl the documentation site at https://docs.example.com with a depth of 3"
- "Map all the URLs on https://example.com"
- "Check the status of crawl job abc123"

## Requirements

- Node.js 18+
- A running Firecrawl self-hosted instance
- Network access to the Firecrawl instance

## Troubleshooting

1. **Connection Issues**: Verify your Firecrawl instance is running and accessible
2. **Timeout Errors**: Adjust timeout values in `src/index.ts` for slow websites
3. **Authentication Errors**: Ensure `USE_DB_AUTHENTICATION=false` in your Firecrawl .env file