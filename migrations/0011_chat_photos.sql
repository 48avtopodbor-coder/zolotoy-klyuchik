-- Фото в чате: сам файл лежит отдельно, в сообщении только ключ.
-- Фото видят только автор переписки (по её секретному номеру) и сотрудники в админке.
CREATE TABLE chat_photos (
  key        TEXT PRIMARY KEY,
  chat_id    TEXT NOT NULL,
  data       TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX chat_photos_chat ON chat_photos(chat_id);
ALTER TABLE chat_messages ADD COLUMN photo TEXT;
