ALTER TABLE products ADD COLUMN old_price INTEGER;
ALTER TABLE products ADD COLUMN is_sale   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN in_stock  INTEGER NOT NULL DEFAULT 1;

CREATE TABLE product_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  image_key  TEXT    NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX product_images_product ON product_images(product_id, position);
INSERT INTO product_images (product_id, image_key, position)
  SELECT id, image_key, 0 FROM products WHERE image_key IS NOT NULL;

CREATE TABLE videos (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  url       TEXT    NOT NULL,
  oid       TEXT    NOT NULL,
  vid       TEXT    NOT NULL,
  cover_key TEXT,
  position  INTEGER NOT NULL DEFAULT 0
);
INSERT INTO videos (url, oid, vid, position) VALUES
  ('https://vk.ru/clip-236241268_456239028?c=1', '-236241268', '456239028', 1),
  ('https://vk.ru/clip-236241268_456239022?c=1', '-236241268', '456239022', 2),
  ('https://vk.ru/clip-236241268_456239020?c=1', '-236241268', '456239020', 3),
  ('https://vk.ru/clip-236241268_456239018?c=1', '-236241268', '456239018', 4);

CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
