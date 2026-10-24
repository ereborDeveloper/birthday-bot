import { escape, ageText } from './format.js';

const NOTIFIED_KEY = 'notified_on';

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function groupByChat(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.chat_id)) groups.set(row.chat_id, []);
    groups.get(row.chat_id).push(row);
  }
  return groups;
}

export function formatToday(people, year) {
  const names = people.map(p => `<b>${escape(p.name)}</b>${ageText(p, year)}`).join(', ');
  return `🎂 Сегодня день рождения: ${names}`;
}

export async function notifyIfDue({ store, send, hour, now = new Date() }) {
  if (now.getHours() < hour) return false;
  const today = isoDate(now);
  if (store.getMeta(NOTIFIED_KEY) === today) return false;
  store.setMeta(NOTIFIED_KEY, today);
  const groups = groupByChat(store.birthdaysOn(now.getMonth() + 1, now.getDate()));
  for (const [chatId, people] of groups) {
    try {
      await send(chatId, formatToday(people, now.getFullYear()));
    } catch (err) {
      console.error(`notify failed for chat ${chatId}`, err);
    }
  }
  return true;
}

export function startNotifier(options) {
  const tick = () => notifyIfDue(options);
  tick();
  return setInterval(tick, 60_000);
}
