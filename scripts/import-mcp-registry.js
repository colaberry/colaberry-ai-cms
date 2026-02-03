/* eslint-disable no-console */
const args = process.argv.slice(2);

const urlArgIndex = args.indexOf("--url");
const tokenArgIndex = args.indexOf("--token");
const registryArgIndex = args.indexOf("--registry-url");
const limitArgIndex = args.indexOf("--limit");
const maxArgIndex = args.indexOf("--max");

const baseUrl =
  (urlArgIndex !== -1 ? args[urlArgIndex + 1] : process.env.STRAPI_URL) ||
  "http://localhost:1337";
const token =
  (tokenArgIndex !== -1 ? args[tokenArgIndex + 1] : process.env.STRAPI_TOKEN) || "";
const registryUrl =
  (registryArgIndex !== -1 ? args[registryArgIndex + 1] : process.env.MCP_REGISTRY_URL) ||
  "https://registry.modelcontextprotocol.io/v0.1/servers";
const limit = limitArgIndex !== -1 ? Number(args[limitArgIndex + 1]) : undefined;
const maxRecords = maxArgIndex !== -1 ? Number(args[maxArgIndex + 1]) : undefined;
const shouldPublish = args.includes("--publish");
const dryRun = args.includes("--dry-run");
const wipeExisting = args.includes("--wipe");
const debug = args.includes("--debug");

if (!token && !dryRun) {
  console.error("Missing STRAPI_TOKEN or --token. Provide an API token with create permissions.");
  process.exit(1);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 100);
}

function stableHash(value) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value)
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

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

async function wipeAllMCPs() {
  if (dryRun) {
    console.log("DRY RUN: wipe existing MCP servers");
    return;
  }
  console.log("Wiping existing MCP servers...");
  let page = 1;
  const pageSize = 100;
  let totalDeleted = 0;
  while (true) {
    const res = await request(
      `/api/mcp-servers?publicationState=preview&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
    );
    const items = res?.data || [];
    if (!items.length) {
      break;
    }
    for (const item of items) {
      try {
        await request(`/api/mcp-servers/${item.id}`, { method: "DELETE" });
        totalDeleted += 1;
      } catch (err) {
        console.log(`Failed to delete mcp id ${item.id}: ${err.message}`);
      }
    }
    page += 1;
  }
  console.log(`Wipe complete. Deleted ${totalDeleted} MCP servers.`);
}

async function getOrCreateTag(name) {
  const slug = slugify(name);
  const existing = await request(`/api/tags?filters[slug][$eq]=${encodeURIComponent(slug)}`);
  if (existing.data && existing.data.length) {
    return existing.data[0].id;
  }
  if (dryRun) {
    console.log(`DRY RUN: create tag ${name}`);
    return null;
  }
  const created = await request(`/api/tags`, {
    method: "POST",
    body: JSON.stringify({ data: { name, slug } }),
  });
  return created.data?.id || null;
}

function pickFirst(...values) {
  for (const value of values) {
    if (value) return value;
  }
  return null;
}

function toStringOrNull(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    if (typeof value.url === "string") return value.url;
    if (typeof value.href === "string") return value.href;
  }
  return null;
}

function mapStatus(value) {
  const normalized = String(value || "").toLowerCase();
  if (["live", "active", "stable", "published"].includes(normalized)) return "live";
  if (["beta", "preview", "experimental"].includes(normalized)) return "beta";
  if (["concept", "draft"].includes(normalized)) return "concept";
  if (["deprecated"].includes(normalized)) return "concept";
  return "live";
}

function extractServers(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return (
    payload.servers ||
    payload.data?.servers ||
    payload.data?.items ||
    payload.data?.results ||
    payload.data?.entries ||
    payload.data ||
    payload.items ||
    payload.results ||
    payload.entries ||
    []
  );
}

function buildSlug(source) {
  if (!source) return "";
  const raw = String(source);
  const trimmed = raw.includes("/") ? raw.split("/").pop() : raw;
  return slugify(trimmed || raw);
}

function buildSlugFromCandidates(candidates, fallbackSeed) {
  for (const candidate of candidates) {
    const slug = buildSlug(candidate);
    if (slug && slug !== "mcp-server") {
      return slug;
    }
  }
  if (fallbackSeed) {
    return `mcp-${stableHash(fallbackSeed)}`;
  }
  return "";
}

function mapServer(server, index) {
  const wrapper = server || {};
  const base = wrapper.server || wrapper;
  const meta = wrapper._meta || base._meta || {};
  const repositoryUrl = base.repository?.url || base.repository;

  const name = pickFirst(base.title, base.name, base.id, base.slug, null);
  const slug = buildSlugFromCandidates(
    [
      base.slug,
      base.id,
      base.identifier,
      base.server_id,
      base.name,
      base.title,
      base.package,
      repositoryUrl,
      base.repo,
      base.url,
      base.homepage,
      base.documentation,
      base.docsUrl,
      meta?.links?.source,
      meta?.links?.repository,
    ],
    JSON.stringify(base || {}) + `:${index}`
  );
  const description = pickFirst(
    base.description,
    base.summary,
    base.shortDescription,
    meta?.description
  );
  const status = mapStatus(base.status || meta?.status);
  const tags = [
    ...normalizeList(base.tags),
    ...normalizeList(base.categories),
    ...normalizeList(base.keywords),
    ...normalizeList(base.capabilities),
    ...normalizeList(meta?.tags),
  ];
  const uniqueTags = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
  const docsUrl = toStringOrNull(
    pickFirst(
      base.docsUrl,
      base.docs_url,
      base.documentation,
      base.homepage,
      repositoryUrl,
      base.source,
      base.url,
      meta?.links?.docs,
      meta?.links?.homepage,
      meta?.links?.repository,
      meta?.links?.source
    )
  );
  const sourceUrl = toStringOrNull(
    pickFirst(base.url, repositoryUrl, docsUrl, meta?.links?.source)
  );

  return {
    name: name || `MCP Server ${index + 1}`,
    slug: slug || `mcp-${stableHash(JSON.stringify(server || {}) + `:${index}`)}`,
    description,
    status,
    visibility: "public",
    source: "external",
    sourceUrl: sourceUrl || null,
    industry: base.industry || null,
    category: Array.isArray(base.categories) ? base.categories[0] : base.category || null,
    docsUrl: docsUrl || null,
    tags: uniqueTags,
  };
}

async function fetchRegistryPage(cursor) {
  const url = new URL(registryUrl);
  if (limit) {
    url.searchParams.set("limit", String(limit));
  }
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${url} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function upsertServer(record) {
  if (!record.slug || record.slug === "mcp-server") {
    console.log("Skipped server with invalid slug.", record.name, record.sourceUrl || "");
    return;
  }
  const tagIds = [];
  for (const tag of record.tags) {
    const id = await getOrCreateTag(tag);
    if (id) tagIds.push(id);
  }

  const payload = {
    name: record.name,
    slug: record.slug,
    description: record.description || null,
    status: record.status,
    visibility: record.visibility,
    source: record.source,
    sourceUrl: record.sourceUrl || null,
    industry: record.industry || null,
    category: record.category || null,
    docsUrl: record.docsUrl || null,
    tags: tagIds,
  };

  if (shouldPublish) {
    payload.publishedAt = new Date().toISOString();
  }

  if (dryRun) {
    console.log("DRY RUN:", payload.slug);
    return;
  }

  const existing = await request(
    `/api/mcp-servers?publicationState=preview&filters[slug][$eq]=${encodeURIComponent(
      payload.slug
    )}`
  );

  if (existing.data && existing.data.length) {
    const id = existing.data[0].id;
    try {
      await request(`/api/mcp-servers/${id}`, {
        method: "PUT",
        body: JSON.stringify({ data: payload }),
      });
      console.log(`Updated mcp ${payload.slug}`);
      return;
    } catch (err) {
      if (String(err.message || "").includes("404")) {
        console.log(`Existing mcp ${payload.slug} not found on update. Recreating.`);
      } else {
        throw err;
      }
    }
  }

  try {
    await request(`/api/mcp-servers`, {
      method: "POST",
      body: JSON.stringify({ data: payload }),
    });
    console.log(`Created mcp ${payload.slug}`);
  } catch (err) {
    if (String(err.message || "").includes("unique")) {
      const retry = await request(
        `/api/mcp-servers?publicationState=preview&filters[slug][$eq]=${encodeURIComponent(
          payload.slug
        )}`
      );
      if (retry.data && retry.data.length) {
        const id = retry.data[0].id;
        try {
          await request(`/api/mcp-servers/${id}`, {
            method: "PUT",
            body: JSON.stringify({ data: payload }),
          });
          console.log(`Updated mcp ${payload.slug} after unique conflict`);
          return;
        } catch (updateErr) {
          if (String(updateErr.message || "").includes("404")) {
            console.log(`MCP ${payload.slug} disappeared during update. Skipping.`);
            return;
          }
          throw updateErr;
        }
      }
    }
    throw err;
  }
}

async function run() {
  if (wipeExisting) {
    await wipeAllMCPs();
  }
  let cursor;
  let total = 0;
  const usedSlugs = new Set();
  do {
    const payload = await fetchRegistryPage(cursor);
    if (debug && total === 0) {
      console.log("Registry payload keys:", Object.keys(payload || {}));
      const sample = extractServers(payload)[0];
      if (sample) {
        console.log("Sample server keys:", Object.keys(sample || {}));
      }
    }
    const servers = extractServers(payload);
    if (!servers.length) {
      break;
    }
    for (const server of servers) {
      if (maxRecords && total >= maxRecords) {
        console.log(`Reached max ${maxRecords}.`);
        return;
      }
      const mapped = mapServer(server, total);
      if (usedSlugs.has(mapped.slug)) {
        const unique = `${mapped.slug}-${stableHash(`${mapped.slug}:${total}`)}`;
        mapped.slug = unique;
      }
      usedSlugs.add(mapped.slug);
      if (!mapped.slug) {
        console.log("Skipped server with empty slug.");
        continue;
      }
      await upsertServer(mapped);
      total += 1;
    }
    cursor = payload.nextCursor || payload.next_cursor || payload.cursor || null;
  } while (cursor);
  console.log(`Done. Imported ${total} MCP servers.`);
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
