export function normalizeForCompare(s: string) {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}
export function isNonsense(s: string) {
  const t = normalizeForCompare(s);
  if (!t) return true;
  // If < 2 alphanumerics or mostly symbols, call it nonsense
  const alnum = (t.match(/[a-z0-9]/g) || []).length;
  const nonspace = t.replace(/\s/g, "").length;
  return alnum < 2 || alnum / Math.max(1, nonspace) < 0.3;
}

