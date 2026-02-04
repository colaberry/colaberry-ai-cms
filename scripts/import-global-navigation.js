/* eslint-disable no-console */
const fs = require("fs");

const args = process.argv.slice(2);
const fileArgIndex = args.indexOf("--file");
const urlArgIndex = args.indexOf("--url");
const tokenArgIndex = args.indexOf("--token");

const filePath =
  fileArgIndex !== -1
    ? args[fileArgIndex + 1]
    : process.env.NAV_FILE || "data/global-navigation.json";
const baseUrl =
  (urlArgIndex !== -1 ? args[urlArgIndex + 1] : process.env.STRAPI_URL) ||
  "http://localhost:1337";
const token =
  (tokenArgIndex !== -1 ? args[tokenArgIndex + 1] : process.env.STRAPI_TOKEN) || "";
const shouldPublish = args.includes("--publish");
const dryRun = args.includes("--dry-run");

if (!filePath) {
  console.error(
    "Usage: node scripts/import-global-navigation.js [--file ./path.json] [--url http://localhost:1337] [--token xxx] [--publish] [--dry-run]"
  );
  process.exit(1);
}

if (!token && !dryRun) {
  console.error("Missing STRAPI_TOKEN or --token. Provide an API token with write permissions.");
  process.exit(1);
}

function readPayload() {
  const text = fs.readFileSync(filePath, "utf-8");
  const payload = JSON.parse(text);
  if (shouldPublish) {
    payload.publishedAt = new Date().toISOString();
  }
  return payload;
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

  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (error) {
      json = text;
    }
  }

  if (!res.ok) {
    const message = typeof json === "string" ? json : JSON.stringify(json);
    const error = new Error(`${options.method || "GET"} ${url} failed: ${res.status} ${message}`);
    error.status = res.status;
    throw error;
  }

  return json;
}

async function upsertGlobalNavigation() {
  const payload = readPayload();

  if (dryRun) {
    console.log("Dry run: would upsert global navigation", payload);
    return;
  }

  await request("/api/global-navigation", {
    method: "PUT",
    body: JSON.stringify({ data: payload }),
  });

  console.log("Upserted global navigation (single type via PUT).");
}

upsertGlobalNavigation().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
