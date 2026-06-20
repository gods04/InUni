interface PageViewEvent {
  id: string;
  path: string;
  sessionId: string;
  createdAt: string;
}

export interface LocalTrafficSnapshot {
  pageViewsToday: number;
  trafficSourceLabel: string;
  visitorsToday: number;
}

const analyticsEventsKey = 'inuni.analytics.pageViews';
const analyticsSessionKey = 'inuni.analytics.sessionId';
const retentionDays = 30;

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readEvents(): PageViewEvent[] {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(analyticsEventsKey);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as PageViewEvent[];
  } catch {
    return [];
  }
}

function writeEvents(events: PageViewEvent[]): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(analyticsEventsKey, JSON.stringify(events));
  }
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-session';

  const current = window.sessionStorage.getItem(analyticsSessionKey);
  if (current) return current;

  const next = createId('session');
  window.sessionStorage.setItem(analyticsSessionKey, next);
  return next;
}

function startOfLocalDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function pruneEvents(events: PageViewEvent[], now: Date): PageViewEvent[] {
  const oldestAllowed = now.getTime() - retentionDays * 24 * 60 * 60 * 1000;
  return events.filter(
    (event) => new Date(event.createdAt).getTime() >= oldestAllowed,
  );
}

export function recordPageView(path: string): void {
  if (typeof window === 'undefined') return;

  const now = new Date();
  const events = pruneEvents(readEvents(), now);
  events.push({
    id: createId('page-view'),
    path,
    sessionId: getSessionId(),
    createdAt: now.toISOString(),
  });
  writeEvents(events);
}

export function getLocalTrafficSnapshot(
  now = new Date(),
): LocalTrafficSnapshot {
  const events = pruneEvents(readEvents(), now);
  const todayStart = startOfLocalDay(now).getTime();
  const todayEvents = events.filter(
    (event) => new Date(event.createdAt).getTime() >= todayStart,
  );

  if (events.length !== readEvents().length) {
    writeEvents(events);
  }

  return {
    pageViewsToday: todayEvents.length,
    trafficSourceLabel: 'Local browser tracker',
    visitorsToday: new Set(todayEvents.map((event) => event.sessionId)).size,
  };
}
