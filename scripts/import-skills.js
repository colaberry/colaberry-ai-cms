/* eslint-disable no-console */
const fs = require("fs");

const args = process.argv.slice(2);
const fileArgIndex = args.indexOf("--file");
const urlArgIndex = args.indexOf("--url");
const tokenArgIndex = args.indexOf("--token");

const filePath = fileArgIndex !== -1 ? args[fileArgIndex + 1] : process.env.SKILLS_FILE;
const baseUrl =
  (urlArgIndex !== -1 ? args[urlArgIndex + 1] : process.env.STRAPI_URL) ||
  "http://localhost:1337";
const token =
  (tokenArgIndex !== -1 ? args[tokenArgIndex + 1] : process.env.STRAPI_TOKEN) || "";
const shouldPublish = args.includes("--publish");
const dryRun = args.includes("--dry-run");

if (!filePath) {
  console.error(
    "Usage: node scripts/import-skills.js --file ./path.csv [--url http://localhost:1337] [--token xxx] [--publish] [--dry-run]"
  );
  process.exit(1);
}

if (!token && !dryRun) {
  console.error("Missing STRAPI_TOKEN or --token. Provide an API token with create permissions.");
  process.exit(1);
}

function slugify(value) {
  return String(value || "")
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
  if (!value) return [];
  return String(value)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBool(value, fallback = false) {
  if (value == null || value === "") return fallback;
  return String(value).trim().toLowerCase() === "true";
}

function parseInteger(value) {
  if (value == null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDecimal(value) {
  if (value == null || value === "") return null;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeText(value) {
  return value && String(value).trim().length ? String(value).trim() : null;
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${options.method || "GET"} ${url} failed: ${response.status} ${body}`);
  }

  return response.json();
}

function endpointForRelation(typeKey) {
  if (typeKey === "agents") return "/api/agents";
  if (typeKey === "mcpServers") return "/api/mcp-servers";
  if (typeKey === "useCases") return "/api/use-cases";
  return "";
}

async function getOrCreateTag(name) {
  if (dryRun) {
    console.log(`DRY RUN: tag ${name}`);
    return null;
  }

  const slug = slugify(name);
  const existing = await request(`/api/tags?publicationState=preview&filters[slug][$eq]=${encodeURIComponent(slug)}`);
  if (existing.data?.length) {
    return existing.data[0].id;
  }

  const created = await request(`/api/tags`, {
    method: "POST",
    body: JSON.stringify({ data: { name, slug } }),
  });
  return created.data?.id || null;
}

async function getOrCreateCompany(name) {
  if (dryRun) {
    console.log(`DRY RUN: company ${name}`);
    return null;
  }

  const slug = slugify(name);
  const existing = await request(`/api/companies?publicationState=preview&filters[slug][$eq]=${encodeURIComponent(slug)}`);
  if (existing.data?.length) {
    return existing.data[0].id;
  }

  const created = await request(`/api/companies`, {
    method: "POST",
    body: JSON.stringify({ data: { name, slug } }),
  });
  return created.data?.id || null;
}

async function resolveRelationIds(typeKey, rawValues) {
  const values = parseList(rawValues);
  if (!values.length) return [];
  if (dryRun) {
    console.log(`DRY RUN: ${typeKey} => ${values.join(", ")}`);
    return [];
  }

  const endpoint = endpointForRelation(typeKey);
  if (!endpoint) return [];

  const ids = [];
  for (const value of values) {
    const slug = slugify(value);
    const result = await request(
      `${endpoint}?publicationState=preview&filters[slug][$eq]=${encodeURIComponent(slug)}`
    );
    if (result.data?.length) {
      ids.push(result.data[0].id);
    } else {
      console.warn(`WARN: ${typeKey} relation not found for \"${value}\" (slug: ${slug})`);
    }
  }

  return ids;
}

function normalizeRow(row, headers) {
  const expected = headers.length;
  const normalized = [...row];

  while (normalized.length < expected) normalized.push("");
  if (normalized.length > expected) {
    const overflowStart = expected - 1;
    const mergedTail = normalized.slice(overflowStart).join(",");
    normalized.splice(overflowStart, normalized.length - overflowStart, mergedTail);
  }

  return normalized;
}

async function upsertSkill(payload) {
  if (dryRun) {
    console.log("DRY RUN skill payload:", JSON.stringify(payload, null, 2));
    return;
  }

  const existing = await request(
    `/api/skills?publicationState=preview&filters[slug][$eq]=${encodeURIComponent(payload.slug)}`
  );

  if (existing.data?.length) {
    const id = existing.data[0].id;
    await request(`/api/skills/${id}`, {
      method: "PUT",
      body: JSON.stringify({ data: payload }),
    });
    console.log(`Updated skill ${payload.slug}`);
    return;
  }

  await request(`/api/skills`, {
    method: "POST",
    body: JSON.stringify({ data: payload }),
  });
  console.log(`Created skill ${payload.slug}`);
}

async function importRow(headers, row) {
  const record = {};
  headers.forEach((header, index) => {
    record[header] = row[index] || "";
  });

  const name = normalizeText(record.name);
  if (!name) {
    throw new Error("name is required");
  }

  const tags = parseList(record.tags);
  const companies = parseList(record.companies);

  const tagIds = [];
  for (const tag of tags) {
    const id = await getOrCreateTag(tag);
    if (id) tagIds.push(id);
  }

  const companyIds = [];
  for (const company of companies) {
    const id = await getOrCreateCompany(company);
    if (id) companyIds.push(id);
  }

  const agentIds = await resolveRelationIds("agents", record.agents);
  const mcpServerIds = await resolveRelationIds("mcpServers", record.mcpServers);
  const useCaseIds = await resolveRelationIds("useCases", record.useCases);

  const payload = {
    name,
    slug: normalizeText(record.slug) || slugify(name),
    summary: normalizeText(record.summary),
    longDescription: normalizeText(record.longDescription),
    category: normalizeText(record.category),
    provider: normalizeText(record.provider),
    status: (normalizeText(record.status) || "live").toLowerCase(),
    visibility: (normalizeText(record.visibility) || "public").toLowerCase(),
    source: (normalizeText(record.source) || "internal").toLowerCase(),
    sourceUrl: normalizeText(record.sourceUrl),
    sourceName: normalizeText(record.sourceName),
    verified: parseBool(record.verified, false),
    industry: normalizeText(record.industry),
    skillType: normalizeText(record.skillType),
    inputs: normalizeText(record.inputs),
    outputs: normalizeText(record.outputs),
    prerequisites: normalizeText(record.prerequisites),
    toolsRequired: normalizeText(record.toolsRequired),
    modelsSupported: normalizeText(record.modelsSupported),
    securityNotes: normalizeText(record.securityNotes),
    keyBenefits: normalizeText(record.keyBenefits),
    limitations: normalizeText(record.limitations),
    requirements: normalizeText(record.requirements),
    exampleWorkflow: normalizeText(record.exampleWorkflow),
    usageCount: parseInteger(record.usageCount),
    rating: parseDecimal(record.rating),
    lastUpdated: parseDate(record.lastUpdated),
    docsUrl: normalizeText(record.docsUrl),
    demoUrl: normalizeText(record.demoUrl),
    tags: tagIds,
    companies: companyIds,
    agents: agentIds,
    mcpServers: mcpServerIds,
    useCases: useCaseIds,
  };

  if (shouldPublish) {
    payload.publishedAt = new Date().toISOString();
  }

  await upsertSkill(payload);
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

  console.log(`Importing ${records.length} skills from ${filePath} ...`);
  for (const row of records) {
    const normalized = normalizeRow(row, headers);
    try {
      await importRow(headers, normalized);
    } catch (error) {
      console.error(`Row failed: ${normalized.join(",")}`);
      console.error(error.message || String(error));
    }
  }
  console.log("Done.");
}

run().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
