// src/fetchSources.ts

import * as cheerio from 'cheerio';
import { RawArticle } from './types.js';

// ===================================================================
// 🎯 ПРОМО-КОНФИГУРАЦИЯ: 10 проверенных источников для тестирования
// ===================================================================
// Эти URL-ы ведут на страницы с последними новостями и пресс-релизами
// GPT будет извлекать контент и форматировать в читаемые статьи

const staticSources: { sourceName: string; url: string }[] = [
  
  // === TOP 10 FOR TESTING ===
  
  // 1. MoMA - Museum of Modern Art (New York)
  // Latest exhibitions, acquisitions, programs
  {
    sourceName: 'MoMA',
    url: 'https://www.moma.org/calendar/exhibitions',
  },
  
  // 2. The Met - Metropolitan Museum (New York)
  // Current exhibitions and press releases
  {
    sourceName: 'The Met',
    url: 'https://www.metmuseum.org/exhibitions',
  },
  
  // 3. Tate Modern (London)
  // Major exhibitions and news
  {
    sourceName: 'Tate',
    url: 'https://www.tate.org.uk/visit/tate-modern',
  },
  
  // 4. Christie's Auction House
  // Upcoming auctions and results
  {
    sourceName: "Christie's",
    url: 'https://www.christies.com/calendar',
  },
  
  // 5. Sotheby's Auction House
  // Auction news and highlights
  {
    sourceName: "Sotheby's",
    url: 'https://www.sothebys.com/en/articles',
  },
  
  // 6. Guggenheim Museum (New York)
  // Exhibitions and programs
  {
    sourceName: 'Guggenheim',
    url: 'https://www.guggenheim.org/exhibitions',
  },
  
  // 7. Centre Pompidou (Paris)
  // Major European contemporary art exhibitions
  {
    sourceName: 'Centre Pompidou',
    url: 'https://www.centrepompidou.fr/en/program/agenda',
  },
  
  // 8. SFMOMA (San Francisco)
  // West Coast contemporary art
  {
    sourceName: 'SFMOMA',
    url: 'https://www.sfmoma.org/exhibitions',
  },
  
  // 9. Art Basel
  // Global art fair news
  {
    sourceName: 'Art Basel',
    url: 'https://www.artbasel.com/stories',
  },
  
  // 10. Whitney Museum (New York)
  // American contemporary art
  {
    sourceName: 'Whitney Museum',
    url: 'https://whitney.org/exhibitions',
  },

  // 11. Frieze Art Fair
  // International fair schedule and announcements
  {
    sourceName: 'Frieze',
    url: 'https://www.frieze.com/fairs',
  },

  // 12. TEFAF
  // European fine art fair
  {
    sourceName: 'TEFAF',
    url: 'https://www.tefaf.com/fairs',
  },

  // 13. The Armory Show
  // New York art fair news and press
  {
    sourceName: 'The Armory Show',
    url: 'https://www.thearmoryshow.com/press',
  },

  // 14. Art Dubai
  // Middle East fair announcements
  {
    sourceName: 'Art Dubai',
    url: 'https://www.artdubai.ae/press',
  },
  
  // ===================================================================
  // 💡 ИНСТРУКЦИЯ: Для лучших результатов
  // ===================================================================
  // Эти URL-ы ведут на разделы "exhibitions" и "news"
  // Для получения ПОЛНЫХ статей (не списков):
  // 
  // 1. Откройте любой из этих сайтов в браузере
  // 2. Найдите конкретную новость или выставку
  // 3. Скопируйте полный URL статьи
  // 4. Замените URL выше на конкретный
  // 
  // ПРИМЕР:
  // Вместо: https://www.moma.org/calendar/exhibitions
  // Используйте: https://www.moma.org/calendar/exhibitions/5634
  // ===================================================================
];

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
};

function makeExternalId(sourceName: string, url: string): string {
  const base = `${sourceName}-${url}`;
  return Buffer.from(base).toString('base64').replace(/=+$/g, '');
}

function getSelector(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return DOMAIN_SELECTORS[domain] || 'article, main';
  } catch {
    return 'article, main';
  }
}

export async function fetchRawArticles(): Promise<RawArticle[]> {
  if (staticSources.length === 0) {
    console.warn('[fetchSources] ⚠️  No sources configured');
    return [];
  }

  const maxArticles = parseInt(
    process.env.MAX_ARTICLES_PER_RUN ?? '20',
    10,
  );
  const results: RawArticle[] = [];

  for (const src of staticSources.slice(0, maxArticles)) {
    try {
      console.log(`\n[fetchSources] 📥 Fetching: ${src.sourceName}`);
      console.log(`   URL: ${src.url}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const res = await fetch(src.url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; ArtRegistryBot/1.0; +https://artregplatform.com)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
        },
      });

      clearTimeout(timeout);

      if (!res.ok) {
        console.error(`   ❌ HTTP ${res.status} ${res.statusText}`);
        continue;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      // Use domain-specific selector
      const selector = getSelector(src.url);
      const articleHtml = $(selector).html() || html;

      const externalId = makeExternalId(src.sourceName, src.url);

      results.push({
        url: src.url,
        html: articleHtml,
        sourceName: src.sourceName,
        externalId,
      });

      console.log(`   ✅ Fetched successfully (${articleHtml.length} chars)`);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.error(`   ❌ Timeout (30s) for ${src.url}`);
      } else {
        console.error(`   ❌ Error: ${err.message}`);
      }
    }
  }

  return results;
}

