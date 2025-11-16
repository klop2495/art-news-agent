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
): Promise<void> {
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

  if (!res.ok) {
    const text = await res.text();
    console.error(
      `   [Ingest] ❌ Failed: ${res.status} ${res.statusText}`,
    );
    console.error(`   [Ingest] Response: ${text}`);
    throw new Error(`Ingest failed with status ${res.status}`);
  }

  const json = await res.json();
  console.log(
    `   [Ingest] ✅ ${json.action} - Article ID: ${json.article?.id ?? 'N/A'}`,
  );
}

