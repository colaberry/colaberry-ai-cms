/* eslint-disable no-console */
const args = process.argv.slice(2);

const urlArgIndex = args.indexOf("--url");
const tokenArgIndex = args.indexOf("--token");
const webhookArgIndex = args.indexOf("--webhook");
const limitArgIndex = args.indexOf("--limit");
const dryRun = args.includes("--dry-run");

const baseUrl =
  (urlArgIndex !== -1 ? args[urlArgIndex + 1] : process.env.STRAPI_URL) ||
  "http://localhost:1337";
const token =
  (tokenArgIndex !== -1 ? args[tokenArgIndex + 1] : process.env.STRAPI_TOKEN) || "";
const webhook =
  (webhookArgIndex !== -1 ? args[webhookArgIndex + 1] : process.env.TRANSCRIPT_WEBHOOK_URL) ||
  "";
const limit = limitArgIndex !== -1 ? Number(args[limitArgIndex + 1]) : 20;

if (!token && !dryRun) {
  console.error("Missing STRAPI_TOKEN or --token.");
  process.exit(1);
}

if (!webhook && !dryRun) {
  console.error("Missing TRANSCRIPT_WEBHOOK_URL or --webhook.");
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

async function fetchEpisodes() {
  const res = await request(
    `/api/podcast-episodes?publicationState=preview&pagination[page]=1&pagination[pageSize]=${limit}` +
      `&filters[audioUrl][$notNull]=true` +
      `&filters[transcriptStatus][$ne]=ready` +
      `&sort=publishedDate:desc`
  );
  return res?.data || [];
}

function normalizeSegments(segments) {
  if (!Array.isArray(segments)) return null;
  return segments
    .map((segment) => ({
      start: Number(segment.start) || 0,
      end: segment.end != null ? Number(segment.end) : null,
      text: String(segment.text || "").trim(),
    }))
    .filter((segment) => segment.text);
}

async function updateEpisode(id, data) {
  if (dryRun) {
    console.log("DRY RUN: update", id, Object.keys(data));
    return;
  }
  await request(`/api/podcast-episodes/${id}`, {
    method: "PUT",
    body: JSON.stringify({ data }),
  });
}

async function run() {
  const episodes = await fetchEpisodes();
  if (!episodes.length) {
    console.log("No episodes to transcribe.");
    return;
  }

  for (const item of episodes) {
    const id = item.id;
    const attrs = item.attributes || item;
    const audioUrl = attrs.audioUrl;
    if (!audioUrl) continue;

    console.log(`Transcribing ${attrs.slug || attrs.title}...`);
    await updateEpisode(id, { transcriptStatus: "processing", transcriptSource: "auto" });

    if (dryRun) continue;

    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl,
          slug: attrs.slug,
          title: attrs.title,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Transcript webhook failed");
      }
      const payload = await res.json();
      const segments = normalizeSegments(payload.segments || payload.transcriptSegments);
      const transcriptText = payload.text || payload.transcript || null;
      const transcriptSrt = payload.srt || null;
      const transcriptVtt = payload.vtt || null;

      await updateEpisode(id, {
        transcriptSegments: segments,
        transcript: transcriptText,
        transcriptSrt,
        transcriptVtt,
        transcriptStatus: "ready",
        transcriptSource: "auto",
        transcriptGeneratedAt: new Date().toISOString(),
      });
      console.log(`Transcript ready for ${attrs.slug || attrs.title}`);
    } catch (err) {
      console.error(`Transcript failed for ${attrs.slug || attrs.title}:`, err.message);
      await updateEpisode(id, { transcriptStatus: "failed" });
    }
  }
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
