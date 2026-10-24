import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStore } from '../src/store.js';
import { notifyIfDue } from '../src/notify.js';

function setup() {
  const store = openStore(':memory:');
  store.save(1, { name: 'Андрей', day: 16, month: 9, year: 1990 });
  store.save(1, { name: 'Лена', day: 16, month: 9, year: null });
  store.save(1, { name: 'Папа', day: 17, month: 9, year: null });
  store.save(2, { name: 'Дима', day: 16, month: 9, year: 2000 });
  store.save(3, { name: 'Никто', day: 1, month: 1, year: null });
  const sent = [];
  const send = async (chatId, text) => sent.push([chatId, text]);
  return { store, sent, send };
}

test('sends one message per chat with people born today', async () => {
  const { store, sent, send } = setup();
  const done = await notifyIfDue({ store, send, hour: 9, now: new Date(2026, 8, 16, 9, 0) });
  assert.equal(done, true);
  assert.deepEqual(sent, [
    [1, '🎂 Сегодня день рождения: <b>Андрей</b> (36 лет), <b>Лена</b>'],
    [2, '🎂 Сегодня день рождения: <b>Дима</b> (26 лет)'],
  ]);
});

test('waits until the notify hour', async () => {
  const { store, sent, send } = setup();
  const done = await notifyIfDue({ store, send, hour: 9, now: new Date(2026, 8, 16, 8, 59) });
  assert.equal(done, false);
  assert.equal(sent.length, 0);
});

test('does not send twice on the same day, sends again next day', async () => {
  const { store, sent, send } = setup();
  await notifyIfDue({ store, send, hour: 9, now: new Date(2026, 8, 16, 9, 0) });
  await notifyIfDue({ store, send, hour: 9, now: new Date(2026, 8, 16, 23, 0) });
  assert.equal(sent.length, 2);
  await notifyIfDue({ store, send, hour: 9, now: new Date(2026, 8, 17, 9, 0) });
  assert.deepEqual(sent.at(-1), [1, '🎂 Сегодня день рождения: <b>Папа</b>']);
});

test('a failed send does not block other chats', async () => {
  const { store, sent } = setup();
  const send = async (chatId, text) => {
    if (chatId === 1) throw new Error('blocked');
    sent.push([chatId, text]);
  };
  await notifyIfDue({ store, send, hour: 9, now: new Date(2026, 8, 16, 9, 0) });
  assert.deepEqual(sent.map(([chatId]) => chatId), [2]);
});
