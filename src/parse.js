const MONTHS = ['янв', 'фев', 'мар', 'апр', 'ма', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

const NUMERIC = /(?:^|\s)(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2}|\d{4}))?(?=\s|$)/;
const ISO = /(?:^|\s)(\d{4})-(\d{2})-(\d{2})(?=\s|$)/;
const WORDY = /(?:^|\s)(\d{1,2})\s+((?:янв|фев|мар|апр|ма[йя]|июн|июл|авг|сен|окт|ноя|дек)[а-яё]*)(?:\s+(\d{4}))?(?=\s|$)/i;

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function monthByName(word) {
  const w = word.toLowerCase();
  return MONTHS.findIndex(prefix => w.startsWith(prefix)) + 1;
}

function fullYear(raw) {
  if (raw === undefined) return null;
  const n = Number(raw);
  if (raw.length === 4) return n;
  return n <= 30 ? 2000 + n : 1900 + n;
}

function cleanName(text) {
  return text.replace(/^[\s,:;-]+|[\s,:;-]+$/g, '').replace(/\s+/g, ' ');
}

function matchDate(line) {
  let m = line.match(ISO);
  if (m) return { m, day: +m[3], month: +m[2], year: +m[1] };
  m = line.match(NUMERIC);
  if (m) return { m, day: +m[1], month: +m[2], year: fullYear(m[3]) };
  m = line.match(WORDY);
  if (m) return { m, day: +m[1], month: monthByName(m[2]), year: fullYear(m[3]) };
  return null;
}

export function parseLine(line) {
  const found = matchDate(line.trim());
  if (!found) return { error: 'нет даты' };
  const { m, day, month, year } = found;
  if (month < 1 || month > 12 || day < 1 || day > DAYS_IN_MONTH[month - 1]) return { error: 'такой даты не бывает' };
  const name = cleanName(line.slice(0, m.index) + ' ' + line.slice(m.index + m[0].length));
  if (!name) return { error: 'нет имени' };
  return { name, day, month, year };
}

export function parseMessage(text) {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => ({ line, ...parseLine(line) }));
}
