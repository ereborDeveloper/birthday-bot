import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openStore } from '../src/store.js';
import { formatSoon, formatAll } from '../src/format.js';

const today = new Date(2026, 8, 16);

function storeWith(rows) {
  const store = openStore(':memory:');
  rows.forEach(r => store.save(1, r));
  return store;
}

test('soon shows this and next month with today, past and age marks', () => {
  const store = storeWith([
    { name: 'Лена', day: 16, month: 9, year: 1990 },
    { name: 'Петя', day: 3, month: 9, year: null },
    { name: 'Папа', day: 20, month: 10, year: 1961 },
    { name: 'Далёкий', day: 1, month: 12, year: null },
  ]);
  const text = formatSoon(store.list(1), today);
  assert.match(text, /🎂 <b>16 - Лена \(36 лет\)<\/b> сегодня/);
  assert.match(text, /<s>03 - Петя<\/s>/);
  assert.match(text, /<b>октябрь<\/b>\n20 - Папа \(65 лет\)/);
  assert.doesNotMatch(text, /Далёкий/);
});

test('december wraps to january of next year', () => {
  const store = storeWith([{ name: 'Новогодний', day: 5, month: 1, year: 2000 }]);
  const text = formatSoon(store.list(1), new Date(2026, 11, 10));
  assert.match(text, /<b>январь<\/b>\n05 - Новогодний \(27 лет\)/);
});

test('same name is updated, other chats are isolated', () => {
  const store = openStore(':memory:');
  assert.equal(store.save(1, { name: 'Лена', day: 1, month: 1, year: null }), 'added');
  assert.equal(store.save(1, { name: 'лена', day: 2, month: 2, year: null }), 'updated');
  assert.deepEqual(store.list(1), [{ name: 'лена', day: 2, month: 2, year: null }]);
  assert.deepEqual(store.list(2), []);
  assert.equal(formatAll(store.list(2), today), 'Список пуст. Напиши имя и дату, например: Андрей 12.03');
});
