CREATE TABLE special_days (
  date  TEXT PRIMARY KEY,
  kind  TEXT NOT NULL DEFAULT 'closed',
  open  TEXT,
  close TEXT,
  note  TEXT NOT NULL DEFAULT ''
);
