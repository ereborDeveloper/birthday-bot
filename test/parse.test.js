import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLine } from '../src/parse.js';

test('name then numeric date', () => {
  assert.deepEqual(parseLine('Лена 12.03'), { name: 'Лена', day: 12, month: 3, year: null });
});

test('date then name', () => {
  assert.deepEqual(parseLine('12.03.1990 Лена Иванова'), { name: 'Лена Иванова', day: 12, month: 3, year: 1990 });
});

test('two-digit year', () => {
  assert.equal(parseLine('Петя 5/11/95').year, 1995);
  assert.equal(parseLine('Петя 5/11/05').year, 2005);
});

test('iso date with nickname', () => {
  assert.deepEqual(parseLine('@vasya 1990-07-04'), { name: '@vasya', day: 4, month: 7, year: 1990 });
});

test('month by word', () => {
  assert.deepEqual(parseLine('Папа 3 ноября 1961'), { name: 'Папа', day: 3, month: 11, year: 1961 });
  assert.deepEqual(parseLine('Мама 1 мая'), { name: 'Мама', day: 1, month: 5, year: null });
});

test('separators around name are stripped', () => {
  assert.equal(parseLine('Лена - 12.03').name, 'Лена');
  assert.equal(parseLine('Лена: 12.03').name, 'Лена');
});

test('errors', () => {
  assert.equal(parseLine('Лена').error, 'нет даты');
  assert.equal(parseLine('12.03').error, 'нет имени');
  assert.equal(parseLine('Лена 31.02').error, 'такой даты не бывает');
  assert.equal(parseLine('Лена 12.13').error, 'такой даты не бывает');
});
