import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { openStore } from '../src/store.js';
import { sendNoticeOnce, NOTICE } from '../src/notice.js';

function setup(path = ':memory:') {
  const sent = [];
  const send = async (chatId, text) => sent.push([chatId, text]);
  return { store: openStore(path), sent, send };
}

const now = new Date(2026, 9, 12, 10, 0);

test('notice goes once per chat', async () => {
  const { store, sent, send } = setup();
  assert.equal(await sendNoticeOnce({ store, chatId: 1, send, until: '2026-11-12', now }), true);
  assert.equal(await sendNoticeOnce({ store, chatId: 1, send, until: '2026-11-12', now }), false);
  assert.equal(await sendNoticeOnce({ store, chatId: 2, send, until: '2026-11-12', now }), true);
  assert.deepEqual(sent, [[1, NOTICE], [2, NOTICE]]);
});

test('notice is shown on the cutoff day and not after it', async () => {
  const { store, sent, send } = setup();
  assert.equal(await sendNoticeOnce({ store, chatId: 1, send, until: '2026-11-12', now: new Date(2026, 10, 12, 23, 0) }), true);
  assert.equal(await sendNoticeOnce({ store, chatId: 2, send, until: '2026-11-12', now: new Date(2026, 10, 13, 0, 1) }), false);
  assert.equal(sent.length, 1);
});

test('updates without chat are ignored', async () => {
  const { store, sent, send } = setup();
  assert.equal(await sendNoticeOnce({ store, chatId: undefined, send, until: '2026-11-12', now }), false);
  assert.equal(sent.length, 0);
});

test('seen chats survive reopening the database', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'bday-'));
  const path = join(dir, 'test.db');
  const first = setup(path);
  await sendNoticeOnce({ store: first.store, chatId: 5, send: first.send, until: '2026-11-12', now });
  first.store.close();
  const second = setup(path);
  assert.equal(await sendNoticeOnce({ store: second.store, chatId: 5, send: second.send, until: '2026-11-12', now }), false);
  assert.equal(second.sent.length, 0);
  second.store.close();
  rmSync(dir, { recursive: true, force: true });
});
