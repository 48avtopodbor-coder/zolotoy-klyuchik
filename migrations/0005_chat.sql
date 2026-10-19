CREATE TABLE chats (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  ip_hash    TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE chat_messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id      TEXT NOT NULL,
  from_visitor INTEGER NOT NULL,
  text         TEXT NOT NULL,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX chat_messages_chat ON chat_messages(chat_id, id);
-- какое сообщение в Telegram относится к какому чату (чтобы «Ответить» попадало нужному посетителю)
CREATE TABLE tg_map (
  tg_chat    INTEGER NOT NULL,
  tg_message INTEGER NOT NULL,
  chat_id    TEXT NOT NULL,
  PRIMARY KEY (tg_chat, tg_message)
);
