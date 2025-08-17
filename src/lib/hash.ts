// FNV-1a 32-bit
export function fnv1a32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // normalize to unsigned 32-bit
  return h >>> 0;
}

export function createComparisonHash(dis: string, dat: string): string {
  // Normalize and sort inputs to ensure consistent hash regardless of order
  const normalizedDis = dis.toLowerCase().trim();
  const normalizedDat = dat.toLowerCase().trim();

  // Sort alphabetically to ensure same hash regardless of input order
  const sorted = [normalizedDis, normalizedDat].sort();
  return `${sorted[0]}|${sorted[1]}`;
}

