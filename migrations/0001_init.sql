CREATE TABLE products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  price       INTEGER,
  show_price  INTEGER NOT NULL DEFAULT 1,
  image_key   TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX products_created ON products(created_at DESC);
