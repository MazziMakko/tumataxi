/**
 * Pillar 3 / Business-in-a-Box — Crawler directives
 */
import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tumataxi.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/driver/', '/ride/', '/auth/'] },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
