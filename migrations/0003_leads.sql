CREATE TABLE leads (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  phone      TEXT    NOT NULL,
  message    TEXT    NOT NULL DEFAULT '',
  ip_hash    TEXT    NOT NULL,
  sent       INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX leads_ip_time ON leads(ip_hash, created_at);
