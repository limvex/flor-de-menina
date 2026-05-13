/** Dia civil em America/Maceió (UTC−3 fixo): meia-noite local = 03:00 UTC do mesmo Y-M-D. */

export const DASHBOARD_TIMEZONE = 'America/Maceio';

export function toYmdInMaceio(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DASHBOARD_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function ymdToUtcRange(ymd: string): {
  start: Date;
  endExclusive: Date;
} {
  const [y, mo, d] = ymd.split('-').map(Number);
  if (!y || !mo || !d) throw new Error('INVALID_YMD');
  const start = new Date(Date.UTC(y, mo - 1, d, 3, 0, 0, 0));
  const endExclusive = new Date(Date.UTC(y, mo - 1, d + 1, 3, 0, 0, 0));
  return { start, endExclusive };
}

export function subtractCalendarDaysFromYmd(ymd: string, days: number): string {
  const { start } = ymdToUtcRange(ymd);
  const t = new Date(start.getTime() - days * 24 * 60 * 60 * 1000);
  return toYmdInMaceio(t);
}

export function addOneDayYmd(ymd: string): string {
  const { endExclusive } = ymdToUtcRange(ymd);
  return toYmdInMaceio(new Date(endExclusive.getTime()));
}

export function* eachYmdInclusive(
  fromYmd: string,
  toYmd: string,
): Generator<string> {
  let cur = fromYmd;
  while (cur <= toYmd) {
    yield cur;
    if (cur === toYmd) break;
    cur = addOneDayYmd(cur);
  }
}

export function countInclusiveDays(fromYmd: string, toYmd: string): number {
  return [...eachYmdInclusive(fromYmd, toYmd)].length;
}
