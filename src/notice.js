export const NOTICE = 'Извините, сервер бота сломался, и все сохранённые дни рождения пропали. Добавьте их заново: напишите имя и дату, например «Аня 12.03».';

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function sendNoticeOnce({ store, chatId, send, until, now = new Date() }) {
  if (chatId === undefined || !store.markSeen(chatId)) return false;
  if (isoDate(now) > until) return false;
  await send(chatId, NOTICE);
  return true;
}
