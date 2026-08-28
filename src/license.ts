const SLUG = 'retrieval-rhythm';
const TOKEN_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${TOKEN_KEY}:verdict`;
const API_BASE = 'https://api.sociobot.in/api/v1';

interface Verdict { valid: boolean; checkedAt: number }

export function captureLicense(): void {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: true, checkedAt: 0 }));
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function getLicense(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function cachedUnlocked(): boolean {
  if (!getLicense()) return false;
  try {
    const verdict = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '{}') as Verdict;
    return verdict.valid !== false;
  } catch {
    return true;
  }
}

export function saveLicense(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: true, checkedAt: 0 }));
}

export function removeLicense(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VERDICT_KEY);
}

export async function verifyLicense(force = false): Promise<boolean> {
  const token = getLicense();
  if (!token) return false;
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '{}') as Partial<Verdict>;
    if (!force && cached.checkedAt && Date.now() - cached.checkedAt < 86_400_000) return cached.valid !== false;
  } catch { /* verify below */ }
  const response = await fetch(`${API_BASE}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error('License service is temporarily unavailable.');
  const result = await response.json() as { valid: boolean };
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, checkedAt: Date.now() }));
  return result.valid;
}

export const checkoutUrl = `${API_BASE}/products/${SLUG}/checkout`;
