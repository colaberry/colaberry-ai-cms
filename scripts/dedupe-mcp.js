/* eslint-disable no-console */
const args = process.argv.slice(2);

const baseUrl = (process.env.STRAPI_URL || "http://localhost:1337").replace(/\/+$/, "");
const token = process.env.STRAPI_TOKEN || "";
const apply = args.includes("--apply");
const dryRun = args.includes("--dry-run") || !apply;

if (!token && !dryRun) {
  console.error("Missing STRAPI_TOKEN. Provide an API token with delete permissions.");
  process.exit(1);
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

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getTimestamp(attrs) {
  const candidate = attrs.updatedAt || attrs.createdAt || attrs.publishedAt || null;
  if (!candidate) return 0;
  const time = Date.parse(candidate);
  return Number.isFinite(time) ? time : 0;
}

async function fetchAll() {
  let page = 1;
  const pageSize = 100;
  const all = [];
  while (true) {
    const res = await request(
      `/api/mcp-servers?publicationState=preview&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
    );
    const data = res?.data || [];
    all.push(...data);
    const meta = res?.meta?.pagination;
    if (!meta || page >= meta.pageCount) break;
    page += 1;
  }
  return all;
}

function buildGroups(items) {
  const byRegistry = new Map();
  const bySlug = new Map();
  const byName = new Map();

  for (const item of items) {
    const attrs = item.attributes || {};
    const registryName = normalize(attrs.registryName);
    const slug = normalize(attrs.slug);
    const name = normalize(attrs.name);

    if (registryName) {
      const list = byRegistry.get(registryName) || [];
      list.push(item);
      byRegistry.set(registryName, list);
      continue;
    }
    if (slug) {
      const list = bySlug.get(slug) || [];
      list.push(item);
      bySlug.set(slug, list);
    }
    if (name) {
      const list = byName.get(name) || [];
      list.push(item);
      byName.set(name, list);
    }
  }

  return { byRegistry, bySlug, byName };
}

function pickNewest(items) {
  return items
    .slice()
    .sort((a, b) => {
      const ta = getTimestamp(a.attributes || {});
      const tb = getTimestamp(b.attributes || {});
      if (tb !== ta) return tb - ta;
      return (b.id || 0) - (a.id || 0);
    });
}

async function run() {
  const items = await fetchAll();
  const { byRegistry, bySlug, byName } = buildGroups(items);

  const deleteIds = new Set();
  const keepIds = new Set();

  for (const group of byRegistry.values()) {
    if (group.length < 2) continue;
    const ordered = pickNewest(group);
    keepIds.add(ordered[0].id);
    ordered.slice(1).forEach((item) => deleteIds.add(item.id));
  }

  for (const group of bySlug.values()) {
    if (group.length < 2) continue;
    const ordered = pickNewest(group);
    keepIds.add(ordered[0].id);
    ordered.slice(1).forEach((item) => deleteIds.add(item.id));
  }

  for (const group of byName.values()) {
    if (group.length < 2) continue;
    const ordered = pickNewest(group);
    keepIds.add(ordered[0].id);
    ordered.slice(1).forEach((item) => deleteIds.add(item.id));
  }

  // If an item is marked to delete but also in keepIds, keep it.
  for (const id of Array.from(deleteIds)) {
    if (keepIds.has(id)) deleteIds.delete(id);
  }

  const total = items.length;
  const duplicates = deleteIds.size;
  console.log(`Total MCP servers: ${total}`);
  console.log(`Duplicates to delete: ${duplicates}`);

  if (dryRun) {
    console.log("DRY RUN: no deletions performed.");
    const sample = Array.from(deleteIds).slice(0, 10);
    if (sample.length) {
      console.log("Sample IDs to delete:", sample.join(", "));
    }
    return;
  }

  let deleted = 0;
  for (const id of deleteIds) {
    try {
      await request(`/api/mcp-servers/${id}`, { method: "DELETE" });
      deleted += 1;
      if (deleted % 50 === 0) {
        console.log(`Deleted ${deleted}/${duplicates}`);
      }
    } catch (err) {
      console.log(`Failed to delete ${id}: ${err.message}`);
    }
  }
  console.log(`Deleted ${deleted} duplicates.`);
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
