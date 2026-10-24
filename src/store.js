import { DatabaseSync } from 'node:sqlite';

export function openStore(path) {
  const db = new DatabaseSync(path);
  db.exec(`
    create table if not exists people (
      chat_id integer not null,
      name text not null,
      name_key text not null,
      day integer not null,
      month integer not null,
      year integer,
      primary key (chat_id, name_key)
    );
    create table if not exists meta (
      key text primary key,
      value text not null
    );
    create table if not exists seen_chats (
      chat_id integer primary key
    )
  `);

  const upsert = db.prepare(`
    insert into people (chat_id, name, name_key, day, month, year)
    values (?, ?, ?, ?, ?, ?)
    on conflict (chat_id, name_key) do update set name = excluded.name, day = excluded.day, month = excluded.month, year = excluded.year
  `);
  const exists = db.prepare('select 1 from people where chat_id = ? and name_key = ?');
  const remove = db.prepare('delete from people where chat_id = ? and name_key = ?');
  const all = db.prepare('select name, day, month, year from people where chat_id = ? order by month, day, name');
  const onDate = db.prepare('select chat_id, name, year from people where month = ? and day = ? order by chat_id, name');
  const getMeta = db.prepare('select value from meta where key = ?');
  const setMeta = db.prepare('insert into meta (key, value) values (?, ?) on conflict (key) do update set value = excluded.value');
  const markSeen = db.prepare('insert into seen_chats (chat_id) values (?) on conflict (chat_id) do nothing');

  const key = name => name.toLowerCase().replace(/^@/, '');

  return {
    save(chatId, { name, day, month, year }) {
      const existed = exists.get(chatId, key(name)) !== undefined;
      upsert.run(chatId, name, key(name), day, month, year ?? null);
      return existed ? 'updated' : 'added';
    },
    remove(chatId, name) {
      return remove.run(chatId, key(name)).changes > 0;
    },
    list(chatId) {
      return all.all(chatId).map(row => ({ ...row }));
    },
    birthdaysOn(month, day) {
      return onDate.all(month, day).map(row => ({ ...row }));
    },
    getMeta(name) {
      return getMeta.get(name)?.value ?? null;
    },
    setMeta(name, value) {
      setMeta.run(name, value);
    },
    markSeen(chatId) {
      return markSeen.run(chatId).changes > 0;
    },
    close() {
      db.close();
    },
  };
}
