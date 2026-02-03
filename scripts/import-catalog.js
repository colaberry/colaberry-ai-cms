/* eslint-disable no-console */
const fs = require("fs");

const args = process.argv.slice(2);
const typeArgIndex = args.indexOf("--type");
const fileArgIndex = args.indexOf("--file");
const urlArgIndex = args.indexOf("--url");
const tokenArgIndex = args.indexOf("--token");

const type = typeArgIndex !== -1 ? args[typeArgIndex + 1] : process.env.CATALOG_TYPE;
const filePath = fileArgIndex !== -1 ? args[fileArgIndex + 1] : process.env.CATALOG_FILE;
const baseUrl =
  (urlArgIndex !== -1 ? args[urlArgIndex + 1] : process.env.STRAPI_URL) ||
  "http://localhost:1337";
const token =
  (tokenArgIndex !== -1 ? args[tokenArgIndex + 1] : process.env.STRAPI_TOKEN) || "";
const shouldPublish = args.includes("--publish");
const dryRun = args.includes("--dry-run");

if (!type || !filePath) {
  console.error("Usage: node scripts/import-catalog.js --type agents|mcp --file ./path.csv [--url http://localhost:1337] [--token xxx] [--publish] [--dry-run]");
  process.exit(1);
}

if (!["agents", "mcp"].includes(type)) {
  console.error("Unsupported type. Use --type agents or --type mcp.");
  process.exit(1);
}

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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (current.length || row.length) {
        row.push(current.trim());
        rows.push(row);
      }
      row = [];
      current = "";
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      continue;
    }

    current += char;
  }
  if (current.length || row.length) {
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}

function parseList(value) {
  if (!value) {
    return [];
  }
  return value
    .split("|")
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

async function getOrCreateCompany(name) {
  const slug = slugify(name);
  const existing = await request(`/api/companies?filters[slug][$eq]=${encodeURIComponent(slug)}`);
  if (existing.data && existing.data.length) {
    return existing.data[0].id;
  }
  if (dryRun) {
    console.log(`DRY RUN: create company ${name}`);
    return null;
  }
  const created = await request(`/api/companies`, {
    method: "POST",
    body: JSON.stringify({ data: { name, slug } }),
  });
  return created.data?.id || null;
}

function normalizeRow(row, headers) {
  const expected = headers.length;
  if (row.length === expected) {
    return row;
  }

  const normalized = [...row];
  if (normalized.length > expected) {
    const descriptionIndex = headers.indexOf("description");
    if (descriptionIndex !== -1 && normalized.length > expected) {
      const overflow = normalized.length - expected;
      const mergedDescription = normalized
        .slice(descriptionIndex, descriptionIndex + overflow + 1)
        .join(",");
      normalized.splice(descriptionIndex, overflow + 1, mergedDescription);
    }
  }

  if (normalized.length > expected) {
    const overflowStart = expected - 1;
    const mergedTail = normalized.slice(overflowStart).join(",");
    normalized.splice(overflowStart, normalized.length - overflowStart, mergedTail);
  }

  while (normalized.length < expected) {
    normalized.push("");
  }

  return normalized;
}

async function importRow(typeKey, row, headers) {
  const record = {};
  headers.forEach((header, index) => {
    record[header] = row[index] || "";
  });

  const tags = parseList(record.tags);
  const companies = parseList(record.companies);
  const tagIds = [];
  const companyIds = [];

  for (const tag of tags) {
    const id = await getOrCreateTag(tag);
    if (id) {
      tagIds.push(id);
    }
  }

  for (const company of companies) {
    const id = await getOrCreateCompany(company);
    if (id) {
      companyIds.push(id);
    }
  }

  const payload = {
    name: record.name,
    slug: record.slug || slugify(record.name || ""),
    description: record.description || null,
    status: (record.status || "live").toLowerCase(),
    visibility: (record.visibility || "public").toLowerCase(),
    source: (record.source || "internal").toLowerCase(),
    sourceUrl: record.sourceUrl || null,
    sourceName: record.sourceName || null,
    verified: record.verified ? String(record.verified).toLowerCase() === "true" : false,
    industry: record.industry || null,
    tags: tagIds,
    companies: companyIds,
  };

  if (typeKey === "mcp") {
    payload.category = record.category || null;
    payload.docsUrl = record.docsUrl || null;
  }

  if (shouldPublish) {
    payload.publishedAt = new Date().toISOString();
  }

  if (dryRun) {
    console.log("DRY RUN:", typeKey, payload);
    return;
  }

  const endpoint = typeKey === "agents" ? "/api/agents" : "/api/mcp-servers";
  const existing = await request(
    `${endpoint}?publicationState=preview&filters[slug][$eq]=${encodeURIComponent(payload.slug)}`
  );

  if (existing.data && existing.data.length) {
    const id = existing.data[0].id;
    try {
      await request(`${endpoint}/${id}`, {
        method: "PUT",
        body: JSON.stringify({ data: payload }),
      });
      console.log(`Updated ${typeKey} ${payload.slug}`);
      return;
    } catch (err) {
      if (String(err.message || "").includes("404")) {
        console.log(`Existing ${typeKey} ${payload.slug} not found on update. Recreating.`);
      } else {
        throw err;
      }
    }
  }

  try {
    await request(endpoint, {
      method: "POST",
      body: JSON.stringify({ data: payload }),
    });
    console.log(`Created ${typeKey} ${payload.slug}`);
  } catch (err) {
    if (String(err.message || "").includes("unique")) {
      const retry = await request(
        `${endpoint}?publicationState=preview&filters[slug][$eq]=${encodeURIComponent(payload.slug)}`
      );
      if (retry.data && retry.data.length) {
        const id = retry.data[0].id;
        try {
          await request(`${endpoint}/${id}`, {
            method: "PUT",
            body: JSON.stringify({ data: payload }),
          });
          console.log(`Updated ${typeKey} ${payload.slug} after unique conflict`);
          return;
        } catch (updateErr) {
          if (String(updateErr.message || "").includes("404")) {
            console.log(`${typeKey} ${payload.slug} disappeared during update. Skipping.`);
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
  const csvText = fs.readFileSync(filePath, "utf8");
  const rows = parseCsv(csvText).filter((row) => row.length && row.some((cell) => cell));
  if (!rows.length) {
    console.error("CSV file is empty.");
    process.exit(1);
  }
  const headers = rows[0].map((header) => header.trim());
  const records = rows.slice(1);

  if (!headers.includes("name")) {
    console.error("CSV must include a 'name' column.");
    process.exit(1);
  }

  console.log(`Importing ${records.length} ${type} records...`);
  for (const row of records) {
    const normalized = normalizeRow(row, headers);
    try {
      await importRow(type, normalized, headers);
    } catch (err) {
      console.error(`Row failed: ${normalized.join(",")}`);
      console.error(err.message);
    }
  }
  console.log("Done.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
