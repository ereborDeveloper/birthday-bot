import { Bot, Keyboard } from 'grammy';
import { openStore } from './store.js';
import { parseMessage } from './parse.js';
import { formatSoon, formatAll, formatSaved, escape } from './format.js';
import { startNotifier } from './notify.js';
import { sendNoticeOnce } from './notice.js';

const store = openStore(process.env.DB_PATH ?? 'birthdays.db');
const bot = new Bot(process.env.BOT_TOKEN);

const SOON = 'Ближайшие';
const ALL = 'Все';

const keyboard = new Keyboard().text(SOON).text(ALL).resized().persistent();

const HELP = [
  'Храню дни рождения твоих людей.',
  '',
  '<b>Добавить</b>',
  'Напиши имя и дату, можно несколько строк сразу:',
  '<code>Андрей 12.03</code>',
  '<code>@dima 1990-07-04</code>',
  '<code>Мама 3 ноября 1961</code>',
  '',
  '<b>Удалить</b>',
  '<code>/del Андрей</code> или строка <code>-Андрей</code>',
  '',
  '<b>Посмотреть</b>',
  `Кнопка «${SOON}» показывает этот и следующий месяц, «${ALL}» весь список.`,
  '',
  'В день рождения пришлю сообщение утром.',
].join('\n');

const reply = (ctx, text) => ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });

const removeLine = (chatId, name) => (store.remove(chatId, name) ? `🗑 ${escape(name)}` : `✖ ${escape(name)}: не нашёл`);

const NOTICE_UNTIL = process.env.NOTICE_UNTIL ?? '2026-11-12';

bot.use(async (ctx, next) => {
  try {
    await sendNoticeOnce({ store, chatId: ctx.chat?.id, until: NOTICE_UNTIL, send: (chatId, text) => bot.api.sendMessage(chatId, text) });
  } catch (err) {
    console.error('notice failed', err);
  }
  return next();
});

bot.command(['start', 'help'], ctx => reply(ctx, HELP));
bot.command('soon', ctx => reply(ctx, formatSoon(store.list(ctx.chat.id), new Date())));
bot.command('all', ctx => reply(ctx, formatAll(store.list(ctx.chat.id), new Date())));

bot.command('del', ctx => {
  const name = ctx.match.trim();
  if (!name) return reply(ctx, 'Кого удалить? Пример: /del Андрей');
  return reply(ctx, removeLine(ctx.chat.id, name));
});

bot.on('message:text', ctx => {
  const text = ctx.message.text.trim();
  if (text === SOON) return reply(ctx, formatSoon(store.list(ctx.chat.id), new Date()));
  if (text === ALL) return reply(ctx, formatAll(store.list(ctx.chat.id), new Date()));

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const deletions = lines.filter(l => l.startsWith('-')).map(l => l.slice(1).trim());
  const entries = lines.filter(l => !l.startsWith('-'));

  const removed = deletions.map(name => removeLine(ctx.chat.id, name));
  const saved = parseMessage(entries.join('\n')).map(r => (r.error ? r : { ...r, status: store.save(ctx.chat.id, r) }));

  const out = [...removed, formatSaved(saved)].filter(Boolean).join('\n');
  return reply(ctx, out || HELP);
});

bot.catch(err => console.error(err));

startNotifier({
  store,
  hour: Number(process.env.NOTIFY_HOUR ?? 9),
  send: (chatId, text) => bot.api.sendMessage(chatId, text, { parse_mode: 'HTML' }),
});

bot.start({ onStart: () => console.log('bot started') });
