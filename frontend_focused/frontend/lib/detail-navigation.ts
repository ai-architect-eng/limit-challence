export function returnUrl(value: string | null): string {
  if (!value?.startsWith('/submissions')) return '/submissions';
  try {
    const base = new URL('http://submission-tracker.local');
    const parsed = new URL(value, base);
    return parsed.origin === base.origin && parsed.pathname === '/submissions'
      ? `${parsed.pathname}${parsed.search}`
      : '/submissions';
  } catch {
    return '/submissions';
  }
}

export function documentUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
