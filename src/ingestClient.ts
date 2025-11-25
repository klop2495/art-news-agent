// src/ingestClient.ts

import { IngestNewsPayload } from './types.js';

// Transform agent payload to platform API format
function transformPayload(payload: IngestNewsPayload): any {
  return {
    external_id: payload.external_id,
    title: payload.title,
    subtitle: payload.subtitle,
    excerpt: payload.excerpt || '', // Ensure it's not undefined
    content: payload.content,
    categories: payload.categories,
    tags: payload.tags,
    source_url: payload.source.url, // Extract URL from source object
    featured_image: payload.images?.[0]?.url, // First image as featured
    image_credit: payload.images?.[0]?.credits, // Credits from first image
    meta_title: payload.meta_title,
    meta_description: payload.meta_description,
    og_image: payload.images?.[0]?.url, // Use first image for OG
  };
}

export async function sendToArtRegistry(
  payload: IngestNewsPayload,
): Promise<{ status: 'sent' | 'duplicate'; code: number; body?: string }> {
  const endpoint = process.env.INGEST_ENDPOINT_URL;
  const apiKey = process.env.NEWS_INGEST_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error(
      'INGEST_ENDPOINT_URL or NEWS_INGEST_API_KEY not set in environment',
    );
  }

  // Transform payload to match platform API
  const platformPayload = transformPayload(payload);

  // Debug: Log content length
  console.log(`   [Ingest] Content length: ${platformPayload.content?.length || 0} chars`);
  console.log(`   [Ingest] Excerpt length: ${platformPayload.excerpt?.length || 0} chars`);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(platformPayload),
  });

  const text = await res.text();

  if (!res.ok) {
    // Treat duplicates/ignored as handled
    if (res.status === 409 || res.status === 410) {
      console.warn(`   [Ingest] Duplicate/ignored (${res.status}), skipping re-send`);
      return { status: 'duplicate', code: res.status, body: text };
    }

    console.error(`   [Ingest] ❌ Failed: ${res.status} ${res.statusText}`);
    console.error(`   [Ingest] Response: ${text}`);
    throw new Error(`Ingest failed with status ${res.status}`);
  }

  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    // ignore parse errors
  }
  console.log(
    `   [Ingest] ✅ ${json.action ?? 'created'} - Article ID: ${json.article?.id ?? 'N/A'}`,
  );
  return { status: 'sent', code: res.status, body: text };
}
