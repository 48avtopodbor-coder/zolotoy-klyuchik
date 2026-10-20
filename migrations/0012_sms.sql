-- SMS мастеру на случай, когда Telegram не доходит (нет интернета): журнал отправок и отметки «по этому уже написали»
CREATE TABLE sms_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  kind       TEXT    NOT NULL,              -- lead (заявка), chat (чат), test (пробное)
  ref        TEXT    NOT NULL DEFAULT '',   -- номер заявки или начало номера переписки
  ok         INTEGER NOT NULL,
  info       TEXT    NOT NULL DEFAULT ''    -- ответ сервиса или причина отказа
);
CREATE INDEX sms_log_time ON sms_log(created_at);

-- 0: SMS по заявке ещё не отправляли, 1: отправлено или не нужно. Старые заявки не трогаем
ALTER TABLE leads ADD COLUMN sms INTEGER NOT NULL DEFAULT 0;
UPDATE leads SET sms = 1;

-- номер последнего сообщения посетителя, по которому SMS уже обработано (отправлено или не нужно)
ALTER TABLE chats ADD COLUMN sms_msg INTEGER NOT NULL DEFAULT 0;
UPDATE chats SET sms_msg = COALESCE((SELECT MAX(id) FROM chat_messages m WHERE m.chat_id = chats.id), 0);

-- какие автоответы посетитель получил на странице (hours, price, way, contacts, away)
ALTER TABLE chat_messages ADD COLUMN auto TEXT NOT NULL DEFAULT '';
