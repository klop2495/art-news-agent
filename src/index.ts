// src/index.ts

import 'dotenv/config';
import fs from 'fs';
import { fetchRawArticles } from './fetchSources.js';
import { generateNewsPayload } from './gptClient.js';
import { sendToArtRegistry } from './ingestClient.js';
import type { IngestNewsPayload } from './types.js';

const PROCESSED_FILE = 'processed-articles.json';

// Load list of already processed article IDs
function loadProcessed(): Set<string> {
  if (!fs.existsSync(PROCESSED_FILE)) {
    return new Set();
  }
  try {
    const data = JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf-8'));
    return new Set(data);
  } catch {
    return new Set();
  }
}

// Save updated list of processed article IDs
function saveProcessed(processed: Set<string>): void {
  fs.writeFileSync(
    PROCESSED_FILE,
    JSON.stringify([...processed], null, 2),
  );
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function isRelevantArticle(payload: IngestNewsPayload): { relevant: boolean; reason?: string } {
  const today = startOfToday();
  const publishDate = parseDate(payload.publish_date);
  const eventStart = parseDate(payload.event_dates?.start_date ?? null);
  const eventEnd = parseDate(payload.event_dates?.end_date ?? null);

  const hasUpcomingEvent =
    (!!eventStart && eventStart >= today) ||
    (!!eventEnd && eventEnd >= today);

  const isPublishRecent = !publishDate || publishDate >= today;

  if (hasUpcomingEvent || isPublishRecent) {
    return { relevant: true };
  }

  return {
    relevant: false,
    reason: `Stale content (publish: ${publishDate?.toISOString() ?? 'n/a'}, event start: ${
      eventStart?.toISOString() ?? 'n/a'
    })`,
  };
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 Art News Agent - Run Started');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🔧 Model: ${process.env.OPENAI_MODEL ?? 'gpt-5.1-instant'}`);
  console.log(`🎯 Max articles: ${process.env.MAX_ARTICLES_PER_RUN ?? '20'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const processed = loadProcessed();
  const stats = {
    fetched: 0,
    skipped: 0,
    processed: 0,
    sent: 0,
    errors: 0,
    stale: 0,
  };

  try {
    // Fetch articles
    const rawArticles = await fetchRawArticles();
    stats.fetched = rawArticles.length;
    
    console.log(`\n📊 Fetched ${stats.fetched} article(s) from sources\n`);

    if (stats.fetched === 0) {
      console.log('⚠️  No articles to process. Add sources to src/fetchSources.ts');
      return;
    }

    const apiDelay = parseInt(process.env.API_DELAY_MS ?? '1000', 10);

    // Process each article
    for (const raw of rawArticles) {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`📄 Processing: ${raw.sourceName}`);
      console.log(`   URL: ${raw.url}`);

      // Check if already processed
      if (processed.has(raw.externalId)) {
        console.log('   ⏭️  Already processed, skipping');
        stats.skipped++;
        continue;
      }

      try {
        // Generate payload via GPT
        console.log('   🤖 Calling GPT...');
        const payload = await generateNewsPayload(raw);

        if (!payload) {
          console.log('   ❌ GPT returned empty/invalid payload');
          stats.errors++;
          continue;
        }

        // Validate required fields
        if (!payload.title || !payload.content) {
          console.log('   ❌ Missing required fields (title/content)');
          stats.errors++;
          continue;
        }

        stats.processed++;

        // Fallback: if excerpt is empty, generate from content
        if (!payload.excerpt || payload.excerpt.trim().length === 0) {
          const plainText = payload.content
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          payload.excerpt = plainText.substring(0, 250) + '...';
          console.log('   ℹ️  Generated excerpt from content');
        }

        const relevance = isRelevantArticle(payload);
        if (!relevance.relevant) {
          console.log(`   ⚠️  Skipping outdated material: ${relevance.reason}`);
          stats.stale++;
          continue;
        }

        // Send to platform
        console.log('   📤 Sending to Art Registry Platform...');
        await sendToArtRegistry(payload);
        stats.sent++;

        // Mark as processed
        processed.add(raw.externalId);
        saveProcessed(processed);

        console.log('   ✅ Successfully sent and marked as processed');

        // Delay before next request
        if (apiDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, apiDelay));
        }
      } catch (err: any) {
        console.error(`   ❌ Error: ${err.message}`);
        stats.errors++;
      }
    }
  } catch (err: any) {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
  }

  // Print summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log('📊 RUN SUMMARY');
  console.log(`${'─'.repeat(60)}`);
  console.log(`   Fetched:         ${stats.fetched}`);
  console.log(`   Already Skipped: ${stats.skipped}`);
  console.log(`   Processed:       ${stats.processed}`);
  console.log(`   Successfully Sent: ${stats.sent}`);
  console.log(`   Stale Skipped:   ${stats.stale}`);
  console.log(`   Errors:          ${stats.errors}`);
  console.log(`${'═'.repeat(60)}\n`);

  if (stats.sent > 0) {
    console.log('✅ Run completed successfully\n');
  } else if (stats.skipped === stats.fetched) {
    console.log('ℹ️  All articles already processed\n');
  } else {
    console.log('⚠️  Run completed with errors\n');
  }
}

// Run the agent
main().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});

