// src/gptClient.ts

import OpenAI from 'openai';
import { IngestNewsPayload, RawArticle } from './types.js';
import { z } from 'zod';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Validation schema
const IngestSchema = z.object({
  external_id: z.string(),
  source: z.object({
    name: z.string(),
    url: z.string().url(),
    type: z
      .enum(['official', 'media', 'press_release', 'blog', 'other'])
      .optional(),
  }),
  title: z.string(),
  subtitle: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  additional_sources: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
      }),
    )
    .optional(),
  fact_check: z
    .object({
      confidence: z.enum([
        'verified',
        'official_single_source',
        'low_confidence',
      ]),
      notes: z.string().optional(),
    })
    .optional(),
  images: z
    .array(
      z.object({
        role: z.enum(['featured', 'inline', 'gallery', 'press']),
        url: z.string().url(),
        source_page: z.string().url().optional(),
        caption: z.string().optional(),
        credits: z.string().optional(),
        alt_text: z.string().optional(),
        license_type: z.string().optional(),
        license_url: z.string().url().optional(),
        license_notes: z.string().optional(),
      }),
    )
    .optional(),
});

const SYSTEM_PROMPT = `
You are a professional news editor for a global art & culture platform (Art Registry).

Your role:
1. Transform press releases and institutional announcements into engaging, readable news articles
2. Extract factual content from museums, auction houses, galleries, and art fairs
3. Maintain journalistic quality while preserving all key information
4. Generate structured JSON matching IngestNewsPayload interface

CRITICAL RULES:
- NEVER fabricate URLs, sources, or facts
- ONLY use information present in the input HTML
- ALWAYS provide source.name and source.url
- ALWAYS provide title, content (HTML), and excerpt (2-3 sentences)
- Extract at least one image with role='featured' if available
- For images, extract licensing info:
  • license_type: "cc0", "cc_by", "editorial_only", "unknown"
  • license_url: link to license terms (optional)
  • license_notes: plain language summary
- Set fact_check.confidence:
  • "verified": 2+ independent reliable sources confirm key facts
  • "official_single_source": one official institution/press release
  • "low_confidence": weak or questionable sources
- Content must be clean HTML (no scripts, tracking, ads)
- Output ONLY valid JSON, no markdown or extra text

Quality standards:
- **STRICTLY INFORMATIONAL** tone - NO marketing or promotional language
- Accurate dates, names, institutions
- Clear, concise writing in English
- Proper attribution

Transforming Press Releases - CRITICAL RULES:
- **REMOVE ALL MARKETING LANGUAGE**: No "exciting", "stunning", "unmissable", "must-see"
- **BE SPECIFIC**: Replace vague phrases with concrete facts
  • BAD: "featuring many renowned artists"
  • GOOD: "featuring works by Pablo Picasso, Frida Kahlo, and Yayoi Kusama"
- **EXTRACT ALL NAMES**: Always list specific artist names, curators, artworks mentioned
- **INCLUDE CONCRETE DETAILS**: Dates, locations, number of works, time periods
- **NEUTRAL JOURNALISTIC TONE**: Write as a news reporter, not a PR department
- Keep all facts: dates, names, locations, artists, works, prices, editions
- Structure: factual headline → context → specific details → quotes (if any) → practical info
- For exhibitions: 
  • List ALL mentioned artist names (full names)
  • Specify number of works if mentioned
  • Include opening/closing dates
  • Name the curator if mentioned
- For auctions: 
  • List specific artworks with estimates
  • Name artists and dates of works
  • Include historical sales context with numbers
- For acquisitions:
  • Name the artist, artwork title, year
  • Provenance details if available
  • Purchase price or donation (if public)

Categories to use:
- Market (auctions, sales, art market trends)
- Exhibitions (museum shows, biennials, fairs)
- Galleries (gallery openings, commercial shows)
- Artists (artist profiles, studio visits, interviews)
- Art Tech (NFT, blockchain, digital art, AI)
- Legal (copyright, IP, art crime, restitution)
- Education (art schools, workshops, programs)
- Museums (acquisitions, donations, collections)
- Other (general art news)

Geographic coverage:
- North America (USA, Canada, Mexico)
- South America (Brazil, Argentina, Chile, etc.)
- Europe (all countries)
- Middle East (UAE, Saudi Arabia, Israel, etc.)
- Asia-Pacific (China, Japan, South Korea, Singapore, etc.)
`;

export async function generateNewsPayload(
  rawArticle: RawArticle,
  retries = 3,
): Promise<IngestNewsPayload | null> {
  const defaultLanguage = process.env.DEFAULT_LANGUAGE ?? 'en';
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o';

  const userPrompt = `
Extract and transform this article into professional English-language news content.

Context:
- Source: ${rawArticle.sourceName}
- URL: ${rawArticle.url}
- Target language: ${defaultLanguage}
- Audience: global art world professionals

REQUIRED fields:
- title: Clear, descriptive headline
- excerpt: 2-3 sentence summary (150-250 chars)
- content: FULL article text in clean HTML format - MUST be complete article, NOT just excerpt!
  • Include ALL paragraphs from the original article
  • Wrap paragraphs in <p> tags
  • Preserve article structure
  • Minimum 500 characters for content
- source.name and source.url

IMPORTANT: 
- "content" must contain the FULL article text, not just the excerpt
- "excerpt" is a SHORT summary, "content" is the COMPLETE article
- Do NOT include "external_id" in your response - it will be added automatically.

Raw HTML:
---
${rawArticle.html.substring(0, 30000)}${rawArticle.html.length > 30000 ? '\n...(truncated)' : ''}
---

Return ONLY a JSON object matching IngestNewsPayload.
`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt === 1) {
        console.log(`   [GPT] Using model: ${model}`);
      }

      const completion = await client.chat.completions.create({
        model: model,
        response_format: { type: 'json_object' },
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        console.error('   [GPT] Empty response from OpenAI');
        return null;
      }

      const parsed = JSON.parse(content);
      
      // Add external_id from rawArticle (GPT shouldn't create this)
      parsed.external_id = rawArticle.externalId;
      
      const validated = IngestSchema.parse(parsed);

      // Validate content length (should be more than just excerpt)
      if (validated.content && validated.content.length < 300) {
        console.warn(`   [GPT] ⚠️  Content too short (${validated.content.length} chars) - might be incomplete`);
      }

      console.log(`   [GPT] ✓ Validated: "${validated.title.substring(0, 50)}..."`);
      console.log(`   [GPT] Content: ${validated.content?.length || 0} chars, Excerpt: ${validated.excerpt?.length || 0} chars`);
      return validated as IngestNewsPayload;
    } catch (err: any) {
      // Handle rate limiting
      if (err.status === 429 && attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(
          `   [GPT] Rate limited, waiting ${waitTime}ms (retry ${attempt}/${retries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // Handle invalid model error
      if (err.status === 404 || err.code === 'model_not_found') {
        console.error(`   [GPT] ❌ Model "${model}" not available!`);
        console.error(`   [GPT] Check https://platform.openai.com/docs/models`);
        console.error(`   [GPT] Try fallback: gpt-4o`);
        return null;
      }

      console.error(`   [GPT] Error (attempt ${attempt}/${retries}):`, err.message);

      if (err instanceof z.ZodError) {
        console.error('   [GPT] Validation errors:', err.errors);
      }

      if (attempt === retries) {
        return null;
      }
    }
  }

  return null;
}

