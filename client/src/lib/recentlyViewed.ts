const KEY = "recentlyViewedCases";
const MAX = 8;

export interface RecentEntry {
  id: number;
  viewedAt: string;
}

export function trackRecentlyViewed(caseId: number): void {
  try {
    const existing = getRecentlyViewedEntries();
    const deduped = existing.filter((e) => e.id !== caseId);
    const updated = [{ id: caseId, viewedAt: new Date().toISOString() }, ...deduped].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export function getRecentlyViewedEntries(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentEntry[];
  } catch {
    return [];
  }
}
