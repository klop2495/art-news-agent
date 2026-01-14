// src/fetchSources.ts

import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RawArticle } from './types.js';

type SourceType = 'rss' | 'html';

interface SourceEntry {
  name: string;
  url: string;
  type: SourceType;
  region?: string;
  language?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourcesPath = path.resolve(__dirname, '../config/sources.json');

function loadSources(): SourceEntry[] {
  try {
    const raw = fs.readFileSync(sourcesPath, 'utf-8');
    const parsed = JSON.parse(raw) as SourceEntry[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn('[fetchSources] ⚠️ sources.json is empty, falling back to default list');
      return [];
    }
    return parsed;
  } catch (err) {
    console.warn('[fetchSources] ⚠️ Could not read config/sources.json, falling back to default list', err);
    return [];
  }
}

// Fallback minimal list (if config missing)
const staticSources: SourceEntry[] = [
  { name: 'Art Basel', url: 'https://www.artbasel.com/stories', type: 'html' },
  { name: 'Frieze', url: 'https://www.frieze.com/fairs', type: 'html' },
  { name: 'Artnet News', url: 'https://news.artnet.com/feed', type: 'rss' },
  { name: 'The Art Newspaper', url: 'https://www.theartnewspaper.com/rss.xml', type: 'rss' },
];

const sources = loadSources().length ? loadSources() : staticSources;

// Domain-specific selectors for better content extraction
const DOMAIN_SELECTORS: Record<string, string> = {
  // Top 10 sources
  'moma.org': 'article, .exhibition-detail, .content-block, main',
  'metmuseum.org': 'article, .exhibition-overview, main',
  'tate.org.uk': 'article, .exhibition-content, main',
  'christies.com': 'article, .lot-details, .editorial-content, main',
  'sothebys.com': 'article, .article-content, main',
  'guggenheim.org': 'article, .exhibition-page, main',
  'centrepompidou.fr': 'article, .program-detail, main',
  'sfmoma.org': 'article, .exhibition-content, main',
  'artbasel.com': 'article, .story-content, main',
  'whitney.org': 'article, .exhibition-detail, main',
  'frieze.com': 'article, main, .press-release, .fairs-page',
  'tefaf.com': 'article, main, .fair-detail',
  'thearmoryshow.com': 'article, main, .press-release',
  'artdubai.ae': 'article, main, .press-release',
  'artforum.com': 'article, main, .article-body',
  'artnet.com': 'article, main, .article-body',
  'labiennale.org': 'article, main, .press',
  'documenta.de': 'article, main, .news',
  'manifesta.org': 'article, main, .press',
  'sharjahart.org': 'article, main, .news-article',
  'gwangjubiennale.org': 'article, main, .newsDetail',
  'lacma.org': 'article, main, .field--name-body',
  'getty.edu': 'article, main, .body-content',
  'serpentinegalleries.org': 'article, main, .rich-text',
  'barbican.org.uk': 'article, main, .b-article',
  'maxxi.art': 'article, main, .entry-content',
  'mplus.org.hk': 'article, main, .richtext',
  'mori.art.museum': 'article, main, .news-list',
  'ngv.vic.gov.au': 'article, main, .exhibition__content',
  'powerstationofart.com': 'article, main, .pro_box',
};

// Event/arts keywords to prefilter RSS items
const KEYWORDS = [
  'exhibition',
  'opens',
  'opening',
  'biennial',
  'biennale',
  'triennial',
  'festival',
  'fair',
  'art fair',
  'auction',
  'sale',
  'preview',
  'program',
  'gallery',
  'museum',
  'show',
  'retrospective',
  'art week',
  'artweek',
  'art month',
  'vernissage',
  'art scene',
];

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; ArtRegistryBot/1.0; +https://artregplatform.com)',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
};

const EXCLUDED_SOURCE_HOSTS = new Set([
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  't.me',
  'youtube.com',
  'youtu.be',
  'pinterest.com',
  'tiktok.com',
]);

function makeExternalId(sourceName: string, url: string): string {
  const base = `${sourceName}-${url}`;
  return Buffer.from(base).toString('base64').replace(/=+$/g, '');
}

function normalizeHostname(url: string): string {
  return url.replace(/^www\./, '').toLowerCase();
}

function normalizeUrl(rawUrl: string, baseUrl: string): string | null {
  try {
    const resolved = new URL(rawUrl, baseUrl);
    if (!['http:', 'https:'].includes(resolved.protocol)) {
      return null;
    }
    return resolved.toString();
  } catch {
    return null;
  }
}

function deriveSourceName(url: string, fallbackName: string): string {
  try {
    const host = normalizeHostname(new URL(url).hostname);
    return host || fallbackName;
  } catch {
    return fallbackName;
  }
}

function extractCanonicalUrl($: cheerio.CheerioAPI, baseUrl: string): string | null {
  const candidates = [
    $('link[rel="canonical"]').attr('href'),
    $('meta[property="og:url"]').attr('content'),
    $('meta[name="twitter:url"]').attr('content'),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizeUrl(candidate, baseUrl);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function isExcludedHost(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  return EXCLUDED_SOURCE_HOSTS.has(normalized);
}

function findExternalSourceLink(
  $: cheerio.CheerioAPI,
  baseUrl: string,
): string | null {
  const baseHost = normalizeHostname(new URL(baseUrl).hostname);
  let root = $('article').first();
  if (!root.length) {
    root = $('main').first();
  }
  if (!root.length) {
    root = $('body').first();
  }
  const linkCandidates = root.find('a[href]').toArray();
  const sourceTextPattern = /(source|official|press release|website|official site|full announcement|read more)/i;

  for (const link of linkCandidates) {
    const el = $(link);
    const text = (el.text() || '').trim();
    if (!sourceTextPattern.test(text)) {
      continue;
    }
    const href = el.attr('href');
    if (!href) continue;
    const normalized = normalizeUrl(href, baseUrl);
    if (!normalized) continue;

    const hostname = normalizeHostname(new URL(normalized).hostname);
    if (hostname === baseHost) continue;
    if (isExcludedHost(hostname)) continue;

    return normalized;
  }

  return null;
}

function getSelector(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return DOMAIN_SELECTORS[domain] || 'article, main';
  } catch {
    return 'article, main';
  }
}

function matchesKeywords(text?: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return KEYWORDS.some((kw) => lower.includes(kw));
}

async function fetchHtmlWithTimeout(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: REQUEST_HEADERS,
    });

    if (!res.ok) {
      console.error(`   ❌ HTTP ${res.status} ${res.statusText} for ${url}`);
      return null;
    }

    return await res.text();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error(`   ❌ Timeout (30s) for ${url}`);
    } else {
      console.error(`   ❌ Error: ${err.message}`);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRssItems(src: SourceEntry, limit: number): Promise<RawArticle[]> {
  try {
    console.log(`\n[fetchSources] 📥 RSS: ${src.name}`);
    const res = await fetch(src.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ArtRegistryBot/1.0; +https://artregplatform.com)',
        Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
      },
    });
    if (!res.ok) {
      console.error(`   ❌ RSS HTTP ${res.status} ${res.statusText}`);
      return [];
    }
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const items = $('item').toArray().slice(0, limit);
    const results: RawArticle[] = [];

    for (const item of items) {
      const el = $(item);
      const link = el.find('link').first().text().trim();
      const title = el.find('title').first().text().trim();
      const description = el.find('description').first().text().trim();

      if (title && !matchesKeywords(`${title} ${description}`)) {
        // Skip non-event items to reduce GPT noise
        continue;
      }

      if (!link) continue;

      const externalId = makeExternalId(src.name, link);
      results.push({
        url: link,
        html: '', // will be filled after fetching the page
        sourceName: src.name,
        externalId,
      });
    }

    return results;
  } catch (err: any) {
    console.error(`   ❌ RSS Error: ${err.message}`);
    return [];
  }
}

async function fetchHtmlPage(url: string, sourceName: string): Promise<RawArticle | null> {
  try {
    const html = await fetchHtmlWithTimeout(url);
    if (!html) {
      return null;
    }
    const $ = cheerio.load(html);
    const selector = getSelector(url);
    const articleHtml = $(selector).html() || html;

    const canonicalUrl = extractCanonicalUrl($, url);
    const externalSourceUrl = findExternalSourceLink($, url);
    const primaryUrl = externalSourceUrl || canonicalUrl || url;

    let finalUrl = url;
    let finalHtml = articleHtml;
    let finalSourceName = sourceName;
    let discoveryUrl: string | undefined;
    let discoverySourceName: string | undefined;

    if (primaryUrl && primaryUrl !== url) {
      discoveryUrl = url;
      discoverySourceName = sourceName;

      const canonicalHtml = await fetchHtmlWithTimeout(primaryUrl);
      if (canonicalHtml) {
        const canonical$ = cheerio.load(canonicalHtml);
        const canonicalSelector = getSelector(primaryUrl);
        finalHtml = canonical$(canonicalSelector).html() || canonicalHtml;
        finalUrl = primaryUrl;
        finalSourceName = deriveSourceName(primaryUrl, sourceName);
      }
    } else if (canonicalUrl && canonicalUrl !== url) {
      finalUrl = canonicalUrl;
    }

    const externalId = makeExternalId(finalSourceName, finalUrl);

    return {
      url: finalUrl,
      html: finalHtml,
      sourceName: finalSourceName,
      externalId,
      discoveryUrl,
      discoverySourceName,
    };
  } catch (err: any) {
    return null;
  }
}

export async function fetchRawArticles(): Promise<RawArticle[]> {
  if (sources.length === 0) {
    console.warn('[fetchSources] ⚠️  No sources configured');
    return [];
  }

  const maxArticles = parseInt(
    process.env.MAX_ARTICLES_PER_RUN ?? '20',
    10,
  );
  const results: RawArticle[] = [];

  for (const src of sources.slice(0, maxArticles)) {
    if (src.type === 'rss') {
      const rssItems = await fetchRssItems(src, maxArticles);
      for (const item of rssItems) {
        const page = await fetchHtmlPage(item.url, item.sourceName);
        if (page) {
          results.push(page);
        }
      }
      continue;
    }

    const page = await fetchHtmlPage(src.url, src.name);
    if (page) {
      results.push(page);
    }
  }

  return results;
}
