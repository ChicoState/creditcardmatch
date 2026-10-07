const FALLBACK_PATH = '/results';

export function safeNextPath(
  candidate: string | null | undefined,
  fallback = FALLBACK_PATH,
): string {
  if (
    !candidate?.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.startsWith('/\\') ||
    candidate.includes('\\')
  ) {
    return fallback;
  }

  try {
    const base = new URL('https://credit-card-match.local');
    const resolved = new URL(candidate, base);
    return resolved.origin === base.origin
      ? `${resolved.pathname}${resolved.search}${resolved.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
