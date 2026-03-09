/* eslint-disable no-console */

/**
 * seed-tools.js
 *
 * Parses the plain-text `tools` field from every MCP server in Strapi,
 * creates normalized Tool entries, and links them back via the
 * `linkedTools` manyToMany relation.
 *
 * Usage:
 *   node scripts/seed-tools.js --token <STRAPI_API_TOKEN> [--url http://localhost:1337] [--dry-run]
 */

const args = process.argv.slice(2);

const urlArgIndex = args.indexOf("--url");
const tokenArgIndex = args.indexOf("--token");

const rawBaseUrl =
  (urlArgIndex !== -1 ? args[urlArgIndex + 1] : process.env.STRAPI_URL) ||
  "http://localhost:1337";
const baseUrl = rawBaseUrl.replace(/\/+$/, "");
const token =
  (tokenArgIndex !== -1 ? args[tokenArgIndex + 1] : process.env.STRAPI_TOKEN) || "";
const dryRun = args.includes("--dry-run");
const debug = args.includes("--debug");
const shouldPublish = args.includes("--publish");

if (!token && !dryRun) {
  console.error("Missing STRAPI_TOKEN or --token. Provide an API token with create permissions.");
  process.exit(1);
}

/* ---------- Helpers ---------- */

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 100);
}

/**
 * Tool category inference map.
 * Keys are lowercase tool name fragments; values are the toolCategory enum value.
 */
const TOOL_CATEGORY_MAP = {
  // Communication
  slack: "communication",
  discord: "communication",
  teams: "communication",
  "microsoft teams": "communication",
  telegram: "communication",
  whatsapp: "communication",
  zoom: "communication",
  twilio: "communication",
  intercom: "communication",

  // Database
  mysql: "database",
  postgres: "database",
  postgresql: "database",
  mongodb: "database",
  redis: "database",
  sqlite: "database",
  dynamodb: "database",
  supabase: "database",
  firebase: "database",
  "sql server": "database",
  mssql: "database",
  mariadb: "database",
  neo4j: "database",
  elasticsearch: "database",
  pinecone: "database",
  qdrant: "database",
  weaviate: "database",
  chroma: "database",
  snowflake: "database",
  bigquery: "database",
  clickhouse: "database",

  // Storage
  "google drive": "storage",
  s3: "storage",
  "aws s3": "storage",
  dropbox: "storage",
  box: "storage",
  onedrive: "storage",
  sharepoint: "storage",
  minio: "storage",

  // Email
  gmail: "email",
  mailchimp: "email",
  sendgrid: "email",
  mailgun: "email",
  ses: "email",
  "amazon ses": "email",
  outlook: "email",
  imap: "email",
  smtp: "email",

  // Project Management
  jira: "project-management",
  asana: "project-management",
  trello: "project-management",
  "linear": "project-management",
  monday: "project-management",
  basecamp: "project-management",
  clickup: "project-management",

  // CRM
  salesforce: "crm",
  hubspot: "crm",
  pipedrive: "crm",
  zendesk: "crm",
  freshdesk: "crm",
  stripe: "crm",

  // Developer
  github: "developer",
  gitlab: "developer",
  bitbucket: "developer",
  docker: "developer",
  kubernetes: "developer",
  jenkins: "developer",
  "github actions": "developer",
  circleci: "developer",
  terraform: "developer",
  vercel: "developer",
  netlify: "developer",
  heroku: "developer",
  sentry: "developer",
  postman: "developer",
  swagger: "developer",
  graphql: "developer",
  rest: "developer",
  npm: "developer",
  pip: "developer",

  // Analytics
  "google analytics": "analytics",
  datadog: "analytics",
  grafana: "analytics",
  prometheus: "analytics",
  mixpanel: "analytics",
  amplitude: "analytics",
  segment: "analytics",
  tableau: "analytics",
  "power bi": "analytics",
  looker: "analytics",
  newrelic: "analytics",

  // Marketing
  "google ads": "marketing",
  "facebook ads": "marketing",
  meta: "marketing",
  twitter: "marketing",
  linkedin: "marketing",
  instagram: "marketing",
  tiktok: "marketing",
  youtube: "marketing",
  wordpress: "marketing",
  contentful: "marketing",
  sanity: "marketing",

  // Productivity
  notion: "productivity",
  airtable: "productivity",
  "google sheets": "productivity",
  "google docs": "productivity",
  "google calendar": "productivity",
  calendar: "productivity",
  confluence: "productivity",
  obsidian: "productivity",
  evernote: "productivity",
  todoist: "productivity",
  zapier: "productivity",
  "make.com": "productivity",

  // AI & ML
  openai: "ai-ml",
  anthropic: "ai-ml",
  "claude": "ai-ml",
  "gpt": "ai-ml",
  gemini: "ai-ml",
  "hugging face": "ai-ml",
  huggingface: "ai-ml",
  cohere: "ai-ml",
  replicate: "ai-ml",
  "stable diffusion": "ai-ml",
  midjourney: "ai-ml",
  langchain: "ai-ml",
  llamaindex: "ai-ml",

  // Search
  "brave search": "search",
  brave: "search",
  google: "search",
  bing: "search",
  tavily: "search",
  serper: "search",
  serpapi: "search",
  duckduckgo: "search",
  algolia: "search",

  // Version Control
  git: "version-control",
  svn: "version-control",
  mercurial: "version-control",

  // Cloud
  aws: "cloud",
  gcp: "cloud",
  "google cloud": "cloud",
  azure: "cloud",
  cloudflare: "cloud",
  digitalocean: "cloud",
  linode: "cloud",
};

function inferToolCategory(toolName) {
  const lower = toolName.toLowerCase().trim();

  // Exact match first
  if (TOOL_CATEGORY_MAP[lower]) return TOOL_CATEGORY_MAP[lower];

  // Partial match
  for (const [key, category] of Object.entries(TOOL_CATEGORY_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return category;
  }

  return "other";
}

/**
 * Normalize a raw tool name from the MCP tools text field.
 * Strips common prefixes like "brave_web_search" → "Brave Web Search"
 */
function normalizeToolName(raw) {
  let name = raw.trim();

  // Skip empty or very short entries
  if (name.length < 2) return null;

  // Skip entries that look like descriptions rather than tool names
  if (name.length > 80) return null;

  // Remove leading numbers/bullets (e.g. "1. Tool Name")
  name = name.replace(/^\d+[\.\)]\s*/, "");

  // Remove leading dashes/bullets
  name = name.replace(/^[-•·]\s*/, "");

  // If it's snake_case (like brave_web_search), convert to title case
  if (name.includes("_") && !name.includes(" ")) {
    name = name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // If it's camelCase or PascalCase, split into words
  if (!name.includes(" ") && /[a-z][A-Z]/.test(name)) {
    name = name.replace(/([a-z])([A-Z])/g, "$1 $2");
  }

  // Trim any remaining whitespace
  name = name.trim();

  if (name.length < 2) return null;

  // Title case if all lowercase
  if (name === name.toLowerCase()) {
    name = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return name;
}

/**
 * Extract "end tool" names from the raw MCP tools text.
 * These represent the external services/tools the MCP server connects to,
 * NOT the MCP's internal function names.
 *
 * Strategy: Look for known tool names in the text, server name, description.
 */
function extractEndTools(mcpServer) {
  const found = new Set();

  // Sources to search
  const searchText = [
    mcpServer.name || "",
    mcpServer.description || "",
    mcpServer.tools || "",
    mcpServer.capabilities || "",
    mcpServer.primaryFunction || "",
    mcpServer.category || "",
    mcpServer.industry || "",
    (mcpServer.tags || []).map((t) => t.name || t).join(" "),
    (mcpServer.companies || []).map((c) => c.name || c).join(" "),
  ]
    .join(" ")
    .toLowerCase();

  // Check each known tool against the combined text
  for (const toolName of Object.keys(TOOL_CATEGORY_MAP)) {
    if (toolName.length < 3) continue; // skip very short keys like "s3"
    const pattern = new RegExp(`\\b${toolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "i");
    if (pattern.test(searchText)) {
      // Use the proper cased version
      const properName = toolName
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      found.add(properName);
    }
  }

  // Special case for short keys that need exact matching
  const shortKeys = { s3: "S3", aws: "AWS", gcp: "GCP", git: "Git", npm: "NPM", ses: "SES" };
  for (const [key, label] of Object.entries(shortKeys)) {
    const pattern = new RegExp(`\\b${key}\\b`, "i");
    if (pattern.test(searchText)) {
      found.add(label);
    }
  }

  return Array.from(found);
}

/* ---------- Strapi API ---------- */

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${options.method || "GET"} ${url} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function fetchAllMCPServers() {
  const servers = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const query =
      `/api/mcp-servers?pagination[page]=${page}&pagination[pageSize]=${pageSize}` +
      `&populate[tags][fields][0]=name&populate[tags][fields][1]=slug` +
      `&populate[companies][fields][0]=name&populate[companies][fields][1]=slug` +
      `&populate[linkedTools][fields][0]=name&populate[linkedTools][fields][1]=slug` +
      `&status=draft`;
    const json = await request(query);
    const items = json?.data || [];
    if (items.length === 0) break;

    for (const item of items) {
      const attrs = item?.attributes ?? item;
      servers.push({
        id: item?.id ?? attrs?.id,
        documentId: item?.documentId ?? attrs?.documentId ?? null,
        name: attrs?.name ?? "",
        slug: attrs?.slug ?? "",
        description: attrs?.description ?? "",
        tools: attrs?.tools ?? "",
        capabilities: attrs?.capabilities ?? "",
        primaryFunction: attrs?.primaryFunction ?? "",
        category: attrs?.category ?? "",
        industry: attrs?.industry ?? "",
        tags: (attrs?.tags?.data || attrs?.tags || []).map((t) => ({
          name: t?.attributes?.name ?? t?.name ?? "",
        })),
        companies: (attrs?.companies?.data || attrs?.companies || []).map((c) => ({
          name: c?.attributes?.name ?? c?.name ?? "",
        })),
        linkedTools: (attrs?.linkedTools?.data || attrs?.linkedTools || []).map((t) => ({
          name: t?.attributes?.name ?? t?.name ?? "",
          slug: t?.attributes?.slug ?? t?.slug ?? "",
          documentId: t?.documentId ?? t?.attributes?.documentId ?? null,
        })),
      });
    }

    const pagination = json?.meta?.pagination;
    if (!pagination || page >= pagination.pageCount) break;
    page += 1;
  }

  return servers;
}

async function fetchExistingTools() {
  const tools = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const query =
      `/api/tools?pagination[page]=${page}&pagination[pageSize]=${pageSize}` +
      `&fields[0]=name&fields[1]=slug&fields[2]=toolCategory` +
      `&status=draft`;
    const json = await request(query);
    const items = json?.data || [];
    if (items.length === 0) break;

    for (const item of items) {
      const attrs = item?.attributes ?? item;
      tools.push({
        id: item?.id ?? attrs?.id,
        documentId: item?.documentId ?? attrs?.documentId ?? null,
        name: attrs?.name ?? "",
        slug: attrs?.slug ?? "",
        toolCategory: attrs?.toolCategory ?? "other",
      });
    }

    const pagination = json?.meta?.pagination;
    if (!pagination || page >= pagination.pageCount) break;
    page += 1;
  }

  return tools;
}

async function createTool(toolData) {
  return request("/api/tools", {
    method: "POST",
    body: JSON.stringify({ data: toolData }),
  });
}

async function linkMCPServerToTools(mcpServerDocumentId, toolDocumentIds) {
  return request(`/api/mcp-servers/${mcpServerDocumentId}`, {
    method: "PUT",
    body: JSON.stringify({
      data: {
        linkedTools: toolDocumentIds,
      },
    }),
  });
}

/* ---------- Main ---------- */

async function main() {
  console.log("=== Seed Tools ===");
  console.log(`  Strapi URL: ${baseUrl}`);
  console.log(`  Dry run:    ${dryRun}`);
  console.log(`  Publish:    ${shouldPublish}`);
  console.log("");

  // 1. Fetch all MCP servers
  console.log("[1/5] Fetching MCP servers...");
  const mcpServers = await fetchAllMCPServers();
  console.log(`  Found ${mcpServers.length} MCP servers`);

  // 2. Extract end tools from each server
  console.log("[2/5] Extracting end tools from server data...");
  const toolToServers = new Map(); // toolName → Set of server IDs
  let noToolsCount = 0;

  for (const server of mcpServers) {
    const endTools = extractEndTools(server);
    if (endTools.length === 0) {
      noToolsCount += 1;
      if (debug) console.log(`  [skip] ${server.name} — no end tools detected`);
      continue;
    }

    for (const toolName of endTools) {
      if (!toolToServers.has(toolName)) {
        toolToServers.set(toolName, new Set());
      }
      toolToServers.get(toolName).add(server.id);
    }
  }

  const toolNames = Array.from(toolToServers.keys()).sort();
  console.log(`  Detected ${toolNames.length} unique end tools`);
  console.log(`  ${noToolsCount} servers had no detectable end tools`);

  if (debug) {
    console.log("\n  Tool → Server count:");
    for (const name of toolNames) {
      console.log(`    ${name}: ${toolToServers.get(name).size} servers`);
    }
    console.log("");
  }

  if (dryRun) {
    console.log("\n[DRY RUN] Would create the following tools:");
    for (const name of toolNames) {
      const slug = slugify(name);
      const category = inferToolCategory(name);
      const serverCount = toolToServers.get(name).size;
      console.log(`  - ${name} (slug: ${slug}, category: ${category}, servers: ${serverCount})`);
    }
    console.log(`\n[DRY RUN] Total: ${toolNames.length} tools, ${mcpServers.length - noToolsCount} servers with tool links`);
    return;
  }

  // 3. Fetch existing tools to avoid duplicates
  console.log("[3/5] Fetching existing tools...");
  const existingTools = await fetchExistingTools();
  const existingBySlug = new Map(existingTools.map((t) => [t.slug, t]));
  console.log(`  Found ${existingTools.length} existing tools`);

  // 4. Create new tools
  console.log("[4/5] Creating/updating tools...");
  // Map slug → documentId (Strapi v5 uses documentId for API calls)
  const toolSlugToDocId = new Map(existingTools.map((t) => [t.slug, t.documentId]));
  let created = 0;
  let skipped = 0;

  for (const toolName of toolNames) {
    const slug = slugify(toolName);
    const category = inferToolCategory(toolName);

    if (existingBySlug.has(slug)) {
      toolSlugToDocId.set(slug, existingBySlug.get(slug).documentId);
      skipped += 1;
      if (debug) console.log(`  [exists] ${toolName} (${slug})`);
      continue;
    }

    try {
      const toolData = {
        name: toolName,
        slug,
        description: `MCP servers that connect to ${toolName} for ${category} workflows.`,
        toolCategory: category,
      };

      const result = await createTool(toolData);
      const newDocId = result?.data?.documentId ?? result?.documentId;
      const newId = result?.data?.id ?? result?.id;
      toolSlugToDocId.set(slug, newDocId);
      created += 1;
      console.log(`  [created] ${toolName} (${slug}, id: ${newId}, docId: ${newDocId})`);
    } catch (err) {
      console.error(`  [error] ${toolName}: ${err.message}`);
    }
  }

  console.log(`  Created: ${created}, Skipped (existing): ${skipped}`);

  // 5. Link MCP servers to their tools
  console.log("[5/5] Linking MCP servers to tools...");
  let linked = 0;
  let linkErrors = 0;

  for (const server of mcpServers) {
    if (!server.documentId) {
      if (debug) console.log(`  [skip] ${server.name} — no documentId`);
      continue;
    }

    const endTools = extractEndTools(server);
    if (endTools.length === 0) continue;

    // Get the tool documentIds for this server
    const toolDocIds = [];
    for (const toolName of endTools) {
      const slug = slugify(toolName);
      const toolDocId = toolSlugToDocId.get(slug);
      if (toolDocId) toolDocIds.push(toolDocId);
    }

    if (toolDocIds.length === 0) continue;

    // Check if already linked
    const existingLinkedSlugs = new Set(
      (server.linkedTools || []).map((t) => t.slug)
    );
    const newToolSlugs = endTools.map((n) => slugify(n));
    const needsUpdate = newToolSlugs.some((s) => !existingLinkedSlugs.has(s));

    if (!needsUpdate) {
      if (debug) console.log(`  [skip] ${server.name} — already linked`);
      continue;
    }

    // Merge existing + new tool documentIds
    const existingToolDocIds = (server.linkedTools || [])
      .map((t) => {
        const slug = t.slug;
        return toolSlugToDocId.get(slug);
      })
      .filter(Boolean);
    const allToolDocIds = Array.from(new Set([...existingToolDocIds, ...toolDocIds]));

    try {
      await linkMCPServerToTools(server.documentId, allToolDocIds);
      linked += 1;
      if (debug) {
        console.log(`  [linked] ${server.name} → ${endTools.join(", ")}`);
      }
    } catch (err) {
      linkErrors += 1;
      console.error(`  [error] ${server.name}: ${err.message}`);
    }
  }

  console.log(`  Linked: ${linked}, Errors: ${linkErrors}`);

  console.log("\n=== Done ===");
  console.log(`  Tools created: ${created}`);
  console.log(`  Tools skipped: ${skipped}`);
  console.log(`  Servers linked: ${linked}`);
  console.log(`  Link errors: ${linkErrors}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
