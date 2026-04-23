import type { MetadataRoute } from 'next'
import { listRecentComparisonSlugs, getComparison } from '@/lib/comparisons'

const SITE_URL = 'https://disordat.com'

export const revalidate = 3600 // rebuild at most hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listRecentComparisonSlugs(500)

  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: 'daily',
      priority: 1,
      lastModified: new Date(),
    },
  ]

  // Pull each comparison's created_at for accurate lastmod.
  // KV lookups are fast; 500 is fine within the sitemap revalidate window.
  for (const slug of slugs) {
    const c = await getComparison(slug)
    entries.push({
      url: `${SITE_URL}/vs/${slug}`,
      changeFrequency: 'weekly',
      priority: 0.7,
      lastModified: c?.created_at ? new Date(c.created_at) : new Date(),
    })
  }

  return entries
}
