export interface Day { off: boolean; open: string; close: string }
export interface Hours { days: Day[]; lunch: { on: boolean; from: string; to: string } }
export interface Contacts { phones: string[]; whatsapp: string; telegram: string; address: string }
export interface SpecialDay { date: string; kind: 'closed' | 'short' | 'custom'; open: string | null; close: string | null; note: string }
export interface Settings { hours: Hours; contacts: Contacts; pw: string | null; ver: number }

export const DAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const DAY_LONG = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export const DEFAULT_HOURS: Hours = {
  days: DAY_SHORT.map((_, i) => ({ off: i >= 5, open: '09:00', close: '17:00' })),
  lunch: { on: false, from: '13:00', to: '14:00' },
};
export const DEFAULT_CONTACTS: Contacts = {
  phones: ['8 900 596-45-77'],
  whatsapp: '',
  telegram: 'Vitaliy48ru',
  address: '398027, г. Липецк, ул. Хорошавина, д. 23',
};

export async function loadSettings(db: D1Database): Promise<Settings> {
  const { results } = await db.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
  const m = new Map(results.map((r) => [r.key, r.value]));
  const parse = <T>(k: string, d: T): T => {
    try { const v = m.get(k); return v ? { ...d, ...JSON.parse(v) } : d; } catch { return d; }
  };
  return {
    hours: parse('hours', DEFAULT_HOURS),
    contacts: parse('contacts', DEFAULT_CONTACTS),
    pw: m.get('admin_pw') ?? null,
    ver: Number(m.get('session_ver') ?? 0),
  };
}

export const saveSetting = (db: D1Database, key: string, value: unknown) =>
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .bind(key, typeof value === 'string' ? value : JSON.stringify(value)).run();

/** 8 900 … / +7 … / 900… -> +7900… */
export function phoneTel(p: string): string {
  const d = p.replace(/\D/g, '');
  if (d.length === 11 && (d[0] === '8' || d[0] === '7')) return '+7' + d.slice(1);
  if (d.length === 10) return '+7' + d;
  return '+' + d;
}

export const waNumber = (c: Contacts): string => phoneTel(c.whatsapp || c.phones[0] || '').slice(1);

const fmt = (t: string) => t.replace(/^0/, '');

/** Схлопывает подряд идущие одинаковые дни: «Пн–Пт 9:00–17:00». */
export function hoursRows(h: Hours): { label: string; value: string }[] {
  const val = (d: Day) => (d.off ? 'выходной' : `${fmt(d.open)}–${fmt(d.close)}${h.lunch.on ? `, обед ${fmt(h.lunch.from)}–${fmt(h.lunch.to)}` : ''}`);
  const rows: { label: string; value: string }[] = [];
  let i = 0;
  while (i < 7) {
    let j = i;
    while (j + 1 < 7 && val(h.days[j + 1]) === val(h.days[i])) j++;
    rows.push({ label: i === j ? DAY_SHORT[i] : `${DAY_SHORT[i]}–${DAY_SHORT[j]}`, value: val(h.days[i]) });
    i = j + 1;
  }
  return rows;
}

export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/* ---------- особые дни (праздники, короткие дни) ---------- */

export const loadSpecial = async (db: D1Database): Promise<SpecialDay[]> =>
  (await db.prepare('SELECT date, kind, open, close, note FROM special_days ORDER BY date').all<SpecialDay>()).results;

/** Сегодняшняя дата по Липецку (МСК, UTC+3) в виде ГГГГ-ММ-ДД. */
export const mskToday = (now = Date.now()): string => new Date(now + 3 * 3600e3).toISOString().slice(0, 10);

export const addDaysStr = (date: string, n: number): string => new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);

/** Индекс дня недели: 0 = понедельник. */
export const weekdayIdx = (date: string): number => (new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7;

export const ruDate = (date: string): string =>
  new Date(date + 'T00:00:00Z').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short', timeZone: 'UTC' });

/** Что написать про особый день для посетителей; null, если день и так выходной по обычному графику. */
export function specialLine(sp: SpecialDay, h: Hours): string | null {
  const normallyOff = h.days[weekdayIdx(sp.date)].off;
  const f = (t: string | null) => (t ?? '').replace(/^0/, '');
  if (sp.kind === 'closed') return normallyOff ? null : `${ruDate(sp.date)}: выходной${sp.note ? `, ${sp.note.replace(/\s*\(.*\)$/, '')}` : ''}`;
  return `${ruDate(sp.date)}: ${f(sp.open)}–${f(sp.close)}${sp.note ? `, ${sp.note.replace(/\s*\(.*\)$/, '')}` : ''}`;
}
