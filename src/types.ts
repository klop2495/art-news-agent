// src/types.ts

export type FactConfidence =
  | 'verified'
  | 'official_single_source'
  | 'low_confidence';

export type ImageRole = 'featured' | 'inline' | 'gallery' | 'press';

export interface IngestNewsPayload {
  external_id: string;

  source: {
    name: string;
    url: string;
    type?: 'official' | 'media' | 'press_release' | 'blog' | 'other';
  };

  title: string;
  subtitle?: string;
  excerpt?: string;  // Optional: will fallback to content start
  content: string;
  publish_date?: string; // ISO 8601 date or datetime

  categories?: string[];
  tags?: string[];

  meta_title?: string;
  meta_description?: string;

  event_dates?: {
    start_date: string;
    end_date?: string;
    timezone?: string;
    status?: 'upcoming' | 'ongoing' | 'past';
    location?: string;
  };

  additional_sources?: {
    name: string;
    url: string;
  }[];

  fact_check?: {
    confidence: FactConfidence;
    notes?: string;
  };

  images?: {
    role: ImageRole;
    url: string;
    source_page?: string;
    caption?: string;
    credits?: string;
    alt_text?: string;
    license_type?: string;
    license_url?: string;
    license_notes?: string;
  }[];
}

export interface RawArticle {
  url: string;
  html: string;
  sourceName: string;
  externalId: string;
}

