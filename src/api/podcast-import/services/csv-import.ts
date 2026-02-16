import type { Core } from '@strapi/strapi';

type PodcastImportOptions = {
  csvText: string;
  dryRun: boolean;
  strictMode: boolean;
  createRelations: boolean;
};

type PodcastImportError = {
  row: number;
  slug?: string;
  message: string;
};

type PodcastImportSummary = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  dryRun: boolean;
};

type PodcastImportResult = {
  summary: PodcastImportSummary;
  errors: PodcastImportError[];
};

type CsvParseResult = {
  headers: string[];
  rows: Record<string, string>[];
};

const PODCAST_UID = 'api::podcast-episode.podcast-episode';
const TAG_UID = 'api::tag.tag';
const COMPANY_UID = 'api::company.company';
const INVALID_JSON = Symbol.for('invalid-json');

const PLATFORM_COLUMN_MAP = [
  { aliases: ['appleurl', 'applepodcasturl'], platform: 'apple' },
  { aliases: ['spotifyurl'], platform: 'spotify' },
  { aliases: ['youtubeurl'], platform: 'youtube' },
  { aliases: ['substackurl'], platform: 'substack' },
  { aliases: ['twitterurl', 'xurl'], platform: 'twitter' },
] as const;

const ALLOWED_PLATFORMS = new Set(['apple', 'spotify', 'youtube', 'substack', 'twitter']);

function normalizeHeader(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function slugify(value: string) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseBoolean(value: string | undefined) {
  if (value == null) return undefined;
  const text = String(value).trim().toLowerCase();
  if (!text) return null;
  if (['true', '1', 'yes', 'y'].includes(text)) return true;
  if (['false', '0', 'no', 'n'].includes(text)) return false;
  return null;
}

function parseInteger(value: string | undefined) {
  if (value == null) return undefined;
  const text = String(value).trim();
  if (!text) return null;
  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: string | undefined) {
  if (value == null) return undefined;
  const text = String(value).trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    const [month, day, year] = text.split('/').map((part) => Number(part));
    if (
      Number.isFinite(month) &&
      Number.isFinite(day) &&
      Number.isFinite(year) &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      const m = String(month).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      return `${year}-${m}-${d}`;
    }
  }

  const timestamp = Date.parse(text);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString().slice(0, 10);
}

function parseList(value: string | undefined) {
  if (value == null) return [];
  const text = String(value).trim();
  if (!text) return [];
  if (text.includes('|')) {
    return text
      .split('|')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (text.includes(';')) {
    return text
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return text
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseJsonValue(value: string | undefined) {
  if (value == null) return undefined;
  const text = String(value).trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return INVALID_JSON;
  }
}

function toBlocks(value: string | undefined) {
  if (value == null) return undefined;
  const text = String(value).trim();
  if (!text) return null;

  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/g)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!paragraphs.length) return null;

  return paragraphs.map((paragraph) => ({
    type: 'paragraph',
    children: [{ type: 'text', text: paragraph }],
  }));
}

function parseCsv(text: string): CsvParseResult {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  const normalized = String(text || '').replace(/^\uFEFF/, '');

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    const next = normalized[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(cell);
      cell = '';
      continue;
    }

    if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    if (char === '\r') continue;
    cell += char;
  }

  row.push(cell);
  if (row.some((entry) => String(entry).trim().length > 0)) {
    rows.push(row);
  }

  if (!rows.length) {
    return { headers: [], rows: [] };
  }

  const headers = rows[0].map((entry) => normalizeHeader(entry));
  const records = rows.slice(1).map((recordItems) => {
    const output: Record<string, string> = {};
    headers.forEach((header, index) => {
      output[header] = String(recordItems[index] || '').trim();
    });
    return output;
  });

  return { headers, rows: records };
}

function hasAnyAlias(record: Record<string, string>, aliases: readonly string[]) {
  return aliases.some((alias) => Object.prototype.hasOwnProperty.call(record, alias));
}

function valueFromAliases(record: Record<string, string>, aliases: readonly string[]) {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(record, alias)) {
      return record[alias];
    }
  }
  return undefined;
}

function normalizeStatus(value: string | undefined, fallback = 'draft') {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'published' || normalized === 'draft') return normalized;
  return fallback;
}

function normalizeType(value: string | undefined, fallback = 'internal') {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'internal' || normalized === 'external') return normalized;
  return fallback;
}

function normalizePlatformLinks(record: Record<string, string>) {
  const links: Array<{ platform: string; url: string }> = [];

  const parsed = parseJsonValue(valueFromAliases(record, ['platformlinks']));
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      const platform = String((item as any)?.platform || '').trim().toLowerCase();
      const url = String((item as any)?.url || '').trim();
      if (!ALLOWED_PLATFORMS.has(platform) || !url) continue;
      links.push({ platform, url });
    }
  }

  for (const mapping of PLATFORM_COLUMN_MAP) {
    const value = valueFromAliases(record, mapping.aliases);
    if (value == null) continue;
    const url = String(value).trim();
    if (!url) continue;
    links.push({ platform: mapping.platform, url });
  }

  const deduped: Array<{ platform: string; url: string }> = [];
  const seen = new Set<string>();
  for (const link of links) {
    const key = `${link.platform}:${link.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(link);
  }

  return deduped;
}

function cleanObject<T extends Record<string, unknown>>(input: T) {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    output[key] = value;
  }
  return output as T;
}

async function resolveRelationId(
  strapi: Core.Strapi,
  uid: string,
  name: string,
  createMissing: boolean,
  cache: Map<string, number>
) {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) return null;

  const slug = slugify(normalizedName);
  if (!slug) return null;

  if (cache.has(slug)) {
    return cache.get(slug)!;
  }

  const existing = await (strapi.db.query(uid) as any).findOne({
    where: { slug },
    select: ['id', 'slug'],
  });

  if (existing?.id) {
    cache.set(slug, existing.id as number);
    return existing.id as number;
  }

  if (!createMissing) return null;

  const created = await (strapi.db.query(uid) as any).create({
    data: {
      name: normalizedName,
      slug,
      publishedAt: new Date().toISOString(),
    },
    select: ['id', 'slug'],
  });

  if (!created?.id) return null;
  cache.set(slug, created.id as number);
  return created.id as number;
}

async function resolveTags(
  strapi: Core.Strapi,
  rawTags: string | undefined,
  createMissing: boolean,
  cache: Map<string, number>
) {
  if (rawTags === undefined) return undefined;
  const values = parseList(rawTags);
  const ids: number[] = [];
  for (const value of values) {
    const id = await resolveRelationId(strapi, TAG_UID, value, createMissing, cache);
    if (id != null) ids.push(id);
  }
  return Array.from(new Set(ids));
}

async function resolveCompanies(
  strapi: Core.Strapi,
  rawCompanies: string | undefined,
  createMissing: boolean,
  cache: Map<string, number>
) {
  if (rawCompanies === undefined) return undefined;
  const values = parseList(rawCompanies);
  const ids: number[] = [];
  for (const value of values) {
    const id = await resolveRelationId(strapi, COMPANY_UID, value, createMissing, cache);
    if (id != null) ids.push(id);
  }
  return Array.from(new Set(ids));
}

export async function runPodcastCsvImport(
  strapi: Core.Strapi,
  options: PodcastImportOptions
): Promise<PodcastImportResult> {
  const parsed = parseCsv(options.csvText);

  const summary: PodcastImportSummary = {
    total: parsed.rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    dryRun: options.dryRun,
  };

  const errors: PodcastImportError[] = [];
  const tagCache = new Map<string, number>();
  const companyCache = new Map<string, number>();

  for (let index = 0; index < parsed.rows.length; index += 1) {
    const row = parsed.rows[index];
    const rowNumber = index + 2;

    try {
      const title = String(valueFromAliases(row, ['title', 'name']) || '').trim();
      const slugInput = String(valueFromAliases(row, ['slug']) || '').trim();
      const slug = slugInput || slugify(title);

      if (!title && !slug) {
        throw new Error('Either title or slug must be provided.');
      }

      if (!slug) {
        throw new Error('Unable to derive slug.');
      }

      const existing = await (strapi.db.query(PODCAST_UID) as any).findOne({
        where: { slug },
        select: ['id', 'slug', 'podcastStatus', 'podcastType'],
      });

      const publishedDate = parseDate(valueFromAliases(row, ['publisheddate', 'date']));
      if (publishedDate === null) {
        throw new Error('Invalid publishedDate format. Use YYYY-MM-DD or MM/DD/YYYY.');
      }

      const statusProvided = hasAnyAlias(row, ['podcaststatus', 'status']);
      const typeProvided = hasAnyAlias(row, ['podcasttype', 'type']);

      const podcastStatus = statusProvided
        ? normalizeStatus(valueFromAliases(row, ['podcaststatus', 'status']), 'draft')
        : existing
        ? undefined
        : 'draft';

      const podcastType = typeProvided
        ? normalizeType(valueFromAliases(row, ['podcasttype', 'type']), 'internal')
        : existing
        ? undefined
        : 'internal';

      const transcriptSegmentsValue = parseJsonValue(valueFromAliases(row, ['transcriptsegments']));
      if (transcriptSegmentsValue === INVALID_JSON) {
        throw new Error('Invalid transcriptSegments JSON.');
      }

      const platformLinksValue = parseJsonValue(valueFromAliases(row, ['platformlinks']));
      if (platformLinksValue === INVALID_JSON) {
        throw new Error('Invalid platformLinks JSON.');
      }

      const hasPlatformColumns =
        hasAnyAlias(row, ['platformlinks']) ||
        PLATFORM_COLUMN_MAP.some((entry) => hasAnyAlias(row, entry.aliases));

      const [tags, companies] = await Promise.all([
        resolveTags(strapi, valueFromAliases(row, ['tags']), options.createRelations, tagCache),
        resolveCompanies(
          strapi,
          valueFromAliases(row, ['companies', 'company']),
          options.createRelations,
          companyCache
        ),
      ]);

      const payload = cleanObject({
        title: title || undefined,
        slug,
        publishedDate,
        podcastStatus,
        podcastType,
        episodeNumber: parseInteger(valueFromAliases(row, ['episodenumber', 'episode'])),
        duration: hasAnyAlias(row, ['duration'])
          ? String(valueFromAliases(row, ['duration']) || '').trim() || null
          : undefined,
        audioUrl: hasAnyAlias(row, ['audiourl'])
          ? String(valueFromAliases(row, ['audiourl']) || '').trim() || null
          : undefined,
        buzzsproutEpisodeId: hasAnyAlias(row, ['buzzsproutepisodeid'])
          ? String(valueFromAliases(row, ['buzzsproutepisodeid']) || '').trim() || null
          : undefined,
        buzzsproutEmbedCode: hasAnyAlias(row, ['buzzsproutembedcode'])
          ? String(valueFromAliases(row, ['buzzsproutembedcode']) || '').trim() || null
          : undefined,
        useNativePlayer: parseBoolean(valueFromAliases(row, ['usenativeplayer', 'nativeplayer'])),
        description: toBlocks(valueFromAliases(row, ['description', 'summary'])),
        transcriptStatus: hasAnyAlias(row, ['transcriptstatus'])
          ? String(valueFromAliases(row, ['transcriptstatus']) || '').trim() || null
          : undefined,
        transcriptSource: hasAnyAlias(row, ['transcriptsource'])
          ? String(valueFromAliases(row, ['transcriptsource']) || '').trim() || null
          : undefined,
        transcriptGeneratedAt: hasAnyAlias(row, ['transcriptgeneratedat'])
          ? String(valueFromAliases(row, ['transcriptgeneratedat']) || '').trim() || null
          : undefined,
        transcriptSrt: hasAnyAlias(row, ['transcriptsrt'])
          ? String(valueFromAliases(row, ['transcriptsrt']) || '').trim() || null
          : undefined,
        transcriptVtt: hasAnyAlias(row, ['transcriptvtt'])
          ? String(valueFromAliases(row, ['transcriptvtt']) || '').trim() || null
          : undefined,
        transcriptSegments: transcriptSegmentsValue,
        tags,
        companies,
        platformLinks: hasPlatformColumns ? normalizePlatformLinks(row) : undefined,
      });

      if (Object.keys(payload).length <= 1) {
        summary.skipped += 1;
        continue;
      }

      const shouldPublish =
        payload.podcastStatus != null && String(payload.podcastStatus).toLowerCase() === 'published';
      if (shouldPublish) {
        (payload as any).publishedAt = new Date().toISOString();
      }
      if (payload.podcastStatus != null && String(payload.podcastStatus).toLowerCase() === 'draft') {
        (payload as any).publishedAt = null;
      }

      if (options.dryRun) {
        if (existing) {
          summary.updated += 1;
        } else {
          summary.created += 1;
        }
        continue;
      }

      if (existing?.id) {
        await (strapi.db.query(PODCAST_UID) as any).update({
          where: { id: existing.id },
          data: payload,
        });
        summary.updated += 1;
      } else {
        await (strapi.db.query(PODCAST_UID) as any).create({
          data: payload,
        });
        summary.created += 1;
      }
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ row: rowNumber, slug: valueFromAliases(row, ['slug']), message });

      if (options.strictMode) {
        break;
      }
    }
  }

  return {
    summary,
    errors,
  };
}
