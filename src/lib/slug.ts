// Turns a pair of free-text inputs into a canonical, URL-safe slug.
// The slug is deterministic and order-independent: "X vs Y" and "Y vs X"
// map to the same slug so both routes hit the same cached comparison.

const MAX_SLUG_PART_LENGTH = 40

function slugifyPart(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_PART_LENGTH)
}

/** Build a canonical slug like "framework-13-vs-macbook-air-m3" */
export function buildComparisonSlug(a: string, b: string): string {
  const partA = slugifyPart(a)
  const partB = slugifyPart(b)
  if (!partA || !partB) return ''
  const [first, second] = [partA, partB].sort()
  return `${first}-vs-${second}`
}

/**
 * The slug alphabetizes, so once we look up a stored comparison we need to
 * know which raw input was "first" (for display purposes). Returns whether
 * the caller-provided `dis` came first in the sorted slug order.
 */
export function isDisAlphabeticallyFirst(dis: string, dat: string): boolean {
  return slugifyPart(dis) <= slugifyPart(dat)
}
