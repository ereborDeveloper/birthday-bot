const MONTH_NAMES = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

export function escape(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function yearsWord(n) {
  const r10 = n % 10;
  const r100 = n % 100;
  if (r100 >= 11 && r100 <= 14) return 'лет';
  if (r10 === 1) return 'год';
  if (r10 >= 2 && r10 <= 4) return 'года';
  return 'лет';
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export function ageText(p, yearOfEvent) {
  if (!p.year) return '';
  const age = yearOfEvent - p.year;
  return ` (${age} ${yearsWord(age)})`;
}

function personLine(p, today, yearOfEvent) {
  const text = `${pad(p.day)} - ${escape(p.name)}${ageText(p, yearOfEvent)}`;
  const sameMonth = p.month === today.getMonth() + 1 && yearOfEvent === today.getFullYear();
  if (sameMonth && p.day === today.getDate()) return `🎂 <b>${text}</b> сегодня`;
  if (sameMonth && p.day < today.getDate()) return `<s>${text}</s>`;
  return text;
}

function monthBlock(people, month, year, today) {
  const rows = people.filter(p => p.month === month);
  const body = rows.length === 0 ? 'никого' : rows.map(p => personLine(p, today, year)).join('\n');
  return `<b>${MONTH_NAMES[month - 1]}</b>\n${body}`;
}

export function formatSoon(people, today) {
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return monthBlock(people, month, year, today) + '\n\n' + monthBlock(people, nextMonth, nextYear, today);
}

export function formatAll(people, today) {
  if (people.length === 0) return 'Список пуст. Напиши имя и дату, например: Андрей 12.03';
  const year = today.getFullYear();
  const months = [...new Set(people.map(p => p.month))];
  return months.map(m => monthBlock(people, m, year, today)).join('\n\n');
}

export function formatSaved(results) {
  return results
    .map(r => {
      if (r.error) return `✖ ${escape(r.line)}: ${r.error}`;
      const date = `${pad(r.day)}.${pad(r.month)}${r.year ? '.' + r.year : ''}`;
      return `${r.status === 'updated' ? '↻' : '✔'} ${escape(r.name)} ${date}`;
    })
    .join('\n');
}
