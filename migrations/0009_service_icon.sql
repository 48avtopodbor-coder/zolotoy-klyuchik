ALTER TABLE services ADD COLUMN icon TEXT NOT NULL DEFAULT 'key';
UPDATE services SET icon = 'fob'   WHERE title LIKE '%омофон%';
UPDATE services SET icon = 'phone' WHERE title LIKE '%плёнк%';
