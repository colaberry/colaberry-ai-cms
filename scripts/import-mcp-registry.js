/* eslint-disable no-console */
const args = process.argv.slice(2);

const urlArgIndex = args.indexOf("--url");
const tokenArgIndex = args.indexOf("--token");
const registryArgIndex = args.indexOf("--registry-url");
const limitArgIndex = args.indexOf("--limit");
const maxArgIndex = args.indexOf("--max");

const rawBaseUrl =
  (urlArgIndex !== -1 ? args[urlArgIndex + 1] : process.env.STRAPI_URL) ||
  "http://localhost:1337";
const baseUrl = rawBaseUrl.replace(/\/+$/, "");
const token =
  (tokenArgIndex !== -1 ? args[tokenArgIndex + 1] : process.env.STRAPI_TOKEN) || "";
const registryUrl =
  (registryArgIndex !== -1 ? args[registryArgIndex + 1] : process.env.MCP_REGISTRY_URL) ||
  "https://registry.modelcontextprotocol.io/v0.1/servers";
const registryBase = registryUrl.replace(/\/v0\.1\/servers.*$/, "").replace(/\/+$/, "");
const limit = limitArgIndex !== -1 ? Number(args[limitArgIndex + 1]) : undefined;
const maxRecords = maxArgIndex !== -1 ? Number(args[maxArgIndex + 1]) : undefined;
const shouldPublish = args.includes("--publish");
const dryRun = args.includes("--dry-run");
const wipeExisting = args.includes("--wipe");
const debug = args.includes("--debug");
const overwrite = args.includes("--overwrite");
const fillEmptyOnly = !overwrite;
const updateOnly = args.includes("--update-only");
const withLatest = args.includes("--with-latest");

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

function isEmptyValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    if (value?.data && Array.isArray(value.data)) return value.data.length === 0;
  }
  return false;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function uniqueList(list) {
  return Array.from(new Set(list.map((item) => String(item).trim()).filter(Boolean)));
}

function joinList(list) {
  if (!list || !list.length) return null;
  return uniqueList(list).join("\n");
}

function detectOpenSource(repositoryUrl, sourceUrl) {
  const combined = `${String(repositoryUrl || "")} ${String(sourceUrl || "")}`.toLowerCase();
  if (!combined.trim()) return null;
  return /(github|gitlab|bitbucket)\.com/.test(combined);
}

function inferServerType(base, packages) {
  const hasPackages = packages.length > 0;
  const hasRemotes = Boolean(base.remotes || base.remote || base.remoteUrl || base.remote_url);
  if (hasPackages && hasRemotes) return "Hybrid";
  if (hasPackages) return "Package";
  if (hasRemotes) return "Remote";
  return null;
}

function normalizeRegistryName(value) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  return String(value || "").trim();
}

function getRegistryNameFromServer(server) {
  const wrapper = server || {};
  const base = wrapper.server || wrapper;
  const candidates = [
    base.name,
    base.serverName,
    base.server_name,
    base.identifier,
    base.id,
    wrapper.name,
    wrapper.serverName,
    wrapper.server_name,
    wrapper.identifier,
    wrapper.id,
  ];
  for (const candidate of candidates) {
    const value = normalizeRegistryName(candidate);
    if (!value) continue;
    if (value.includes('/')) return value;
  }
  return null;
}

async function fetchLatestServerDetails(registryName) {
  if (!registryName) return null;
  const url = `${registryBase}/v0.1/servers/${encodeURIComponent(registryName)}/versions/latest`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${url} failed: ${res.status} ${text}`);
  }
  return res.json();
}

function inferHostingOptions(base, packages) {
  const options = [];
  if (packages.length > 0) options.push("Package");
  if (base.remotes || base.remote || base.remoteUrl || base.remote_url) options.push("Remote");
  return options;
}

function inferLanguage(registryTypes) {
  const map = {
    npm: "JavaScript/TypeScript",
    pypi: "Python",
    nuget: ".NET",
    cargo: "Rust",
    go: "Go",
    docker: "Container",
    gem: "Ruby",
  };
  const languages = registryTypes.map((type) => map[type] || type).filter(Boolean);
  return uniqueList(languages).join(", ") || null;
}

function findMetaValue(obj, keys) {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findMetaValue(item, keys);
      if (found !== null && found !== undefined) return found;
    }
    return null;
  }
  for (const [key, value] of Object.entries(obj)) {
    if (keys.includes(key)) return value;
    const found = findMetaValue(value, keys);
    if (found !== null && found !== undefined) return found;
  }
  return null;
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

function extractInvalidKey(message) {
  const match = String(message || "").match(/Invalid key\\s+([a-zA-Z0-9_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  const jsonMatch = String(message || "").match(/"key"\s*:\s*"([^"]+)"/);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1];
  }
  return null;
}

async function requestWithFallback(method, path, payload) {
  try {
    await request(path, {
      method,
      body: JSON.stringify({ data: payload }),
    });
    return payload;
  } catch (err) {
    const invalidKey = extractInvalidKey(err.message);
    if (invalidKey && Object.prototype.hasOwnProperty.call(payload, invalidKey)) {
      const nextPayload = { ...payload };
      delete nextPayload[invalidKey];
      console.log(`Retrying ${method} without unsupported field: ${invalidKey}`);
      await request(path, {
        method,
        body: JSON.stringify({ data: nextPayload }),
      });
      return nextPayload;
    }
    throw err;
  }
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

function extractNextCursor(payload) {
  if (!payload) return null;
  const metadata = payload.metadata || payload.meta || {};
  return (
    metadata.nextCursor ||
    metadata.next_cursor ||
    payload.nextCursor ||
    payload.next_cursor ||
    payload.cursor ||
    null
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

function mapServer(server, index, latest) {
  const wrapper = server || {};
  const base = wrapper.server || wrapper;
  const detail = latest?.server || latest || {};
  const meta = wrapper._meta || base._meta || {};
  const detailMeta = latest?._meta || detail._meta || {};
  const repositoryUrl = pickFirst(detail.repository?.url, detail.repository, base.repository?.url, base.repository);

  const registryName = getRegistryNameFromServer(server);
  const name = pickFirst(base.title, base.name, base.id, base.slug, detail.title, detail.name, detail.id, detail.slug, null);
  const slug = buildSlugFromCandidates(
    [
      base.slug,
      base.id,
      base.identifier,
      base.server_id,
      base.name,
      base.title,
      detail.slug,
      detail.id,
      detail.identifier,
      detail.server_id,
      detail.name,
      detail.title,
      base.package,
      repositoryUrl,
      base.repo,
      base.url,
      base.homepage,
      base.documentation,
      base.docsUrl,
      detail.package,
      detail.repo,
      detail.url,
      detail.homepage,
      detail.documentation,
      detail.docsUrl,
      meta?.links?.source,
      meta?.links?.repository,
    ],
    JSON.stringify(base || {}) + `:${index}`
  );
  const description = pickFirst(
    base.description,
    base.summary,
    base.shortDescription,
    detail.description,
    detail.summary,
    detail.shortDescription,
    meta?.description,
    detailMeta?.description
  );
  const status = mapStatus(base.status || detail.status || meta?.status || detailMeta?.status);

  const tags = [
    ...normalizeList(base.tags),
    ...normalizeList(base.categories),
    ...normalizeList(base.keywords),
    ...normalizeList(base.capabilities),
    ...normalizeList(detail.tags),
    ...normalizeList(detail.categories),
    ...normalizeList(detail.keywords),
    ...normalizeList(detail.capabilities),
    ...normalizeList(meta?.tags),
    ...normalizeList(detailMeta?.tags),
  ];
  const uniqueTags = uniqueList(tags);

  const docsUrl = toStringOrNull(
    pickFirst(
      base.docsUrl,
      base.docs_url,
      base.documentation,
      base.homepage,
      repositoryUrl,
      base.source,
      base.url,
      detail.docsUrl,
      detail.docs_url,
      detail.documentation,
      detail.homepage,
      detail.source,
      detail.url,
      meta?.links?.docs,
      meta?.links?.homepage,
      meta?.links?.repository,
      meta?.links?.source,
      detailMeta?.links?.docs,
      detailMeta?.links?.homepage,
      detailMeta?.links?.repository,
      detailMeta?.links?.source
    )
  );
  const sourceUrl = toStringOrNull(
    pickFirst(base.url, detail.url, repositoryUrl, docsUrl, meta?.links?.source, detailMeta?.links?.source)
  );

  const packages = Array.isArray(base.packages)
    ? base.packages
    : Array.isArray(detail.packages)
      ? detail.packages
      : base.package
        ? [base.package]
        : detail.package
          ? [detail.package]
          : [];
  const registryTypes = packages
    .map((pkg) => pkg?.registryType || pkg?.registry_type || pkg?.type)
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  const serverType = inferServerType(base, packages) || inferServerType(detail, packages);
  const hostingOptions = inferHostingOptions(base, packages).length
    ? inferHostingOptions(base, packages)
    : inferHostingOptions(detail, packages);
  const language = inferLanguage(registryTypes);
  const openSource = detectOpenSource(repositoryUrl, sourceUrl);

  const capabilityList = uniqueList([
    ...normalizeList(base.capabilities),
    ...normalizeList(base.features),
    ...normalizeList(detail.capabilities),
    ...normalizeList(detail.features),
    ...normalizeList(meta?.capabilities),
    ...normalizeList(meta?.features),
    ...normalizeList(detailMeta?.capabilities),
    ...normalizeList(detailMeta?.features),
    ...uniqueTags,
  ]);
  const toolList = uniqueList([
    ...normalizeList(base.tools),
    ...normalizeList(base.actions),
    ...normalizeList(base.endpoints),
    ...normalizeList(base.functions),
    ...normalizeList(detail.tools),
    ...normalizeList(detail.actions),
    ...normalizeList(detail.endpoints),
    ...normalizeList(detail.functions),
    ...normalizeList(meta?.tools),
    ...normalizeList(detailMeta?.tools),
  ]);
  const authList = uniqueList([
    ...normalizeList(base.authMethods),
    ...normalizeList(base.auth),
    ...normalizeList(base.authentication),
    ...normalizeList(detail.authMethods),
    ...normalizeList(detail.auth),
    ...normalizeList(detail.authentication),
    ...normalizeList(meta?.authMethods),
    ...normalizeList(detailMeta?.authMethods),
  ]);
  const pricingList = uniqueList([
    ...normalizeList(base.pricing),
    ...normalizeList(detail.pricing),
    ...normalizeList(meta?.pricing),
    ...normalizeList(detailMeta?.pricing),
  ]);

  const compatibility = pickFirst(
    detail.mcpVersion,
    detail.protocolVersion,
    detail.protocol,
    base.mcpVersion,
    base.protocolVersion,
    base.protocol,
    meta?.mcpVersion,
    meta?.protocolVersion,
    detailMeta?.mcpVersion,
    detailMeta?.protocolVersion
  );

  const tryItNowUrl = toStringOrNull(
    pickFirst(
      base.tryItNowUrl,
      base.demoUrl,
      base.demo,
      base.playground,
      base.website,
      base.homepage,
      detail.tryItNowUrl,
      detail.demoUrl,
      detail.demo,
      detail.playground,
      detail.website,
      detail.homepage,
      meta?.links?.demo,
      meta?.links?.try,
      meta?.links?.sandbox,
      detailMeta?.links?.demo,
      detailMeta?.links?.try,
      detailMeta?.links?.sandbox
    )
  );

  const primaryFunction = pickFirst(
    base.primaryFunction,
    base.summary,
    base.longDescription,
    base.description,
    detail.primaryFunction,
    detail.summary,
    detail.longDescription,
    detail.description,
    meta?.summary,
    detailMeta?.summary
  );

  const usageCount = toNumberOrNull(
    findMetaValue([meta, detailMeta], ["download_count", "downloadCount", "usage_count", "usageCount"])
  );
  const rating = toNumberOrNull(
    findMetaValue([meta, detailMeta], ["user_rating", "userRating", "rating"])
  );

  const lastUpdated = pickFirst(
    detail.updatedAt,
    detail.updated_at,
    detail.modifiedAt,
    detail.modified_at,
    base.updatedAt,
    base.updated_at,
    base.modifiedAt,
    base.modified_at,
    wrapper.updatedAt,
    wrapper.updated_at,
    meta?.updatedAt,
    meta?.updated_at,
    detailMeta?.updatedAt,
    detailMeta?.updated_at
  );

  return {
    name: name || `MCP Server ${index + 1}`,
    slug: slug || `mcp-${stableHash(JSON.stringify(server || {}) + `:${index}`)}`,
    registryName,
    description,
    status,
    visibility: "public",
    source: "external",
    sourceUrl: sourceUrl || null,
    industry: base.industry || detail.industry || null,
    category: Array.isArray(base.categories) ? base.categories[0] : base.category || detail.category || null,
    docsUrl: docsUrl || null,
    tags: uniqueTags,
    serverType,
    primaryFunction,
    openSource,
    language,
    capabilities: joinList(capabilityList),
    tools: joinList(toolList),
    authMethods: joinList(authList),
    hostingOptions: joinList(hostingOptions),
    compatibility: compatibility ? String(compatibility) : null,
    pricing: joinList(pricingList),
    tryItNowUrl: tryItNowUrl || null,
    usageCount,
    rating,
    lastUpdated: lastUpdated ? String(lastUpdated) : null,
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
    registryName: record.registryName || null,
    description: record.description || null,
    status: record.status,
    visibility: record.visibility,
    source: record.source,
    sourceUrl: record.sourceUrl || null,
    sourceName: "Registry",
    verified: true,
    industry: record.industry || null,
    category: record.category || null,
    docsUrl: record.docsUrl || null,
    tags: tagIds,
    serverType: record.serverType || null,
    primaryFunction: record.primaryFunction || null,
    openSource: typeof record.openSource === "boolean" ? record.openSource : null,
    language: record.language || null,
    capabilities: record.capabilities || null,
    tools: record.tools || null,
    authMethods: record.authMethods || null,
    hostingOptions: record.hostingOptions || null,
    compatibility: record.compatibility || null,
    pricing: record.pricing || null,
    tryItNowUrl: record.tryItNowUrl || null,
    usageCount: typeof record.usageCount === "number" ? record.usageCount : null,
    rating: typeof record.rating === "number" ? record.rating : null,
    lastUpdated: record.lastUpdated || null,
  };

  if (shouldPublish) {
    payload.publishedAt = new Date().toISOString();
  }

  if (dryRun) {
    console.log("DRY RUN:", payload.slug);
    return;
  }

  const primaryKey = payload.registryName ? "registryName" : "slug";
  const primaryValue = payload.registryName || payload.slug;
  let existing = await request(
    `/api/mcp-servers?publicationState=preview&filters[${primaryKey}][$eq]=${encodeURIComponent(
      primaryValue
    )}&populate[tags][fields][0]=name`
  );

  if ((!existing.data || !existing.data.length) && payload.registryName) {
    existing = await request(
      `/api/mcp-servers?publicationState=preview&filters[slug][$eq]=${encodeURIComponent(
        payload.slug
      )}&populate[tags][fields][0]=name`
    );
  }

  if (existing.data && existing.data.length) {
    const id = existing.data[0].id;
    const existingAttrs = existing.data[0].attributes || {};
    const existingTags = existingAttrs?.tags?.data || [];
    const updatePayload = {};

    Object.entries(payload).forEach(([key, value]) => {
      if (key === "tags") return;
      if (value === undefined) return;
      if (!fillEmptyOnly || isEmptyValue(existingAttrs[key])) {
        updatePayload[key] = value;
      }
    });

    if ((!fillEmptyOnly || existingTags.length === 0) && tagIds.length) {
      updatePayload.tags = tagIds;
    }

    if (!Object.keys(updatePayload).length) {
      if (debug) {
        console.log(`No updates needed for ${payload.slug}`);
      }
      return;
    }

    try {
      await requestWithFallback("PUT", `/api/mcp-servers/${id}`, updatePayload);
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


  if (updateOnly) {
    console.log(`Skipped create for ${payload.slug} (update-only).`);
    return;
  }

  try {
    await requestWithFallback("POST", `/api/mcp-servers`, payload);
    console.log(`Created mcp ${payload.slug}`);
  } catch (err) {
    if (String(err.message || "").includes("unique")) {
      const retryKey = payload.registryName ? "registryName" : "slug";
      const retryValue = payload.registryName || payload.slug;
      const retry = await request(
        `/api/mcp-servers?publicationState=preview&filters[${retryKey}][$eq]=${encodeURIComponent(
          retryValue
        )}`
      );
      if (retry.data && retry.data.length) {
        const id = retry.data[0].id;
        try {
          await requestWithFallback("PUT", `/api/mcp-servers/${id}`, payload);
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
      let latest = null;
      if (withLatest) {
        const registryName = getRegistryNameFromServer(server);
        if (registryName) {
          try {
            latest = await fetchLatestServerDetails(registryName);
          } catch (err) {
            console.log(`Failed to fetch latest for ${registryName}: ${err.message}`);
          }
        }
      }
      const mapped = mapServer(server, total, latest);
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
    cursor = extractNextCursor(payload);
  } while (cursor);
  console.log(`Done. Imported ${total} MCP servers.`);
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
