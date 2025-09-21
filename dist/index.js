#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
class FirecrawlLocalClient {
    baseURL;
    constructor(baseURL) {
        // Priority: 1. Parameter, 2. Environment variable, 3. Default
        this.baseURL = (baseURL ||
            process.env.FIRECRAWL_URL ||
            process.env.FIRECRAWL_BASE_URL ||
            "http://localhost:3002").replace(/\/$/, "");
    }
    async scrape(url, options = {}) {
        try {
            const response = await axios.post(`${this.baseURL}/v0/scrape`, {
                url,
                ...options
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            return response.data;
        }
        catch (error) {
            throw new McpError(ErrorCode.InternalError, `Scrape failed: ${error.message}`);
        }
    }
    async crawl(url, options = {}) {
        try {
            const response = await axios.post(`${this.baseURL}/v0/crawl`, {
                url,
                ...options
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            return response.data;
        }
        catch (error) {
            throw new McpError(ErrorCode.InternalError, `Crawl failed: ${error.message}`);
        }
    }
    async getCrawlStatus(jobId) {
        try {
            const response = await axios.get(`${this.baseURL}/v0/crawl/status/${jobId}`, {
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            throw new McpError(ErrorCode.InternalError, `Get crawl status failed: ${error.message}`);
        }
    }
    async map(url, options = {}) {
        try {
            const response = await axios.post(`${this.baseURL}/v0/map`, {
                url,
                ...options
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            return response.data;
        }
        catch (error) {
            throw new McpError(ErrorCode.InternalError, `Map failed: ${error.message}`);
        }
    }
}
// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const result = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--url' || arg === '-u') {
            result.baseURL = args[++i];
        }
        else if (arg === '--help' || arg === '-h') {
            result.help = true;
        }
    }
    return result;
}
function showHelp() {
    console.error(`
Firecrawl Local MCP Server

Usage: firecrawl-local-mcp [options]

Options:
  -u, --url <url>     Firecrawl instance URL (default: http://localhost:3002)
  -h, --help         Show this help message

Environment Variables:
  FIRECRAWL_URL           Firecrawl instance URL
  FIRECRAWL_BASE_URL      Alternative environment variable for Firecrawl URL

Examples:
  firecrawl-local-mcp --url http://192.168.1.210:3002
  FIRECRAWL_URL=http://my-server:3002 firecrawl-local-mcp
`);
}
const args = parseArgs();
if (args.help) {
    showHelp();
    process.exit(0);
}
const server = new Server({
    name: "firecrawl-local-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
const firecrawl = new FirecrawlLocalClient(args.baseURL);
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "firecrawl_scrape",
                description: "Scrape a single webpage and return its content in markdown format",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: {
                            type: "string",
                            description: "The URL to scrape"
                        },
                        formats: {
                            type: "array",
                            items: { type: "string" },
                            description: "Output formats (markdown, html, rawHtml, screenshot, links, extract)",
                            default: ["markdown"]
                        },
                        onlyMainContent: {
                            type: "boolean",
                            description: "Extract only main content, removing headers, navs, footers",
                            default: true
                        },
                        includeTags: {
                            type: "array",
                            items: { type: "string" },
                            description: "HTML tags to include in the output"
                        },
                        excludeTags: {
                            type: "array",
                            items: { type: "string" },
                            description: "HTML tags to exclude from the output"
                        }
                    },
                    required: ["url"]
                }
            },
            {
                name: "firecrawl_crawl",
                description: "Crawl a website starting from a URL and return content from multiple pages",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: {
                            type: "string",
                            description: "The starting URL to crawl"
                        },
                        includes: {
                            type: "array",
                            items: { type: "string" },
                            description: "URL patterns to include (supports wildcards)"
                        },
                        excludes: {
                            type: "array",
                            items: { type: "string" },
                            description: "URL patterns to exclude (supports wildcards)"
                        },
                        maxDepth: {
                            type: "number",
                            description: "Maximum crawl depth",
                            default: 2
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of pages to crawl",
                            default: 10
                        },
                        allowBackwardLinks: {
                            type: "boolean",
                            description: "Allow crawling backward links",
                            default: false
                        },
                        allowExternalLinks: {
                            type: "boolean",
                            description: "Allow crawling external links",
                            default: false
                        }
                    },
                    required: ["url"]
                }
            },
            {
                name: "firecrawl_crawl_status",
                description: "Check the status of a crawl job",
                inputSchema: {
                    type: "object",
                    properties: {
                        jobId: {
                            type: "string",
                            description: "The job ID returned from a crawl request"
                        }
                    },
                    required: ["jobId"]
                }
            },
            {
                name: "firecrawl_map",
                description: "Map a website to get a list of all accessible URLs",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: {
                            type: "string",
                            description: "The URL to map"
                        },
                        search: {
                            type: "string",
                            description: "Search query to filter URLs"
                        },
                        ignoreSitemap: {
                            type: "boolean",
                            description: "Ignore the website's sitemap",
                            default: false
                        },
                        includeSubdomains: {
                            type: "boolean",
                            description: "Include subdomains in the map",
                            default: false
                        },
                        limit: {
                            type: "number",
                            description: "Maximum number of URLs to return",
                            default: 5000
                        }
                    },
                    required: ["url"]
                }
            }
        ]
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "firecrawl_scrape": {
                const { url, formats = ["markdown"], onlyMainContent = true, includeTags, excludeTags } = args;
                const options = {
                    formats,
                    onlyMainContent
                };
                if (includeTags)
                    options.includeTags = includeTags;
                if (excludeTags)
                    options.excludeTags = excludeTags;
                const result = await firecrawl.scrape(url, options);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            case "firecrawl_crawl": {
                const { url, includes, excludes, maxDepth = 2, limit = 10, allowBackwardLinks = false, allowExternalLinks = false } = args;
                const crawlerOptions = {
                    maxDepth,
                    limit,
                    allowBackwardLinks,
                    allowExternalLinks
                };
                if (includes)
                    crawlerOptions.includes = includes;
                if (excludes)
                    crawlerOptions.excludes = excludes;
                const result = await firecrawl.crawl(url, { crawlerOptions });
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            case "firecrawl_crawl_status": {
                const { jobId } = args;
                const result = await firecrawl.getCrawlStatus(jobId);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            case "firecrawl_map": {
                const { url, search, ignoreSitemap = false, includeSubdomains = false, limit = 5000 } = args;
                const options = {
                    ignoreSitemap,
                    includeSubdomains,
                    limit
                };
                if (search)
                    options.search = search;
                const result = await firecrawl.map(url, options);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
    }
    catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`Firecrawl Local MCP Server running on stdio`);
    console.error(`Connected to Firecrawl instance at: ${firecrawl.baseURL}`);
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map