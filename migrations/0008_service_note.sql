ALTER TABLE services ADD COLUMN note TEXT NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN show_note INTEGER NOT NULL DEFAULT 0;
UPDATE services SET note = 'на все модели', show_note = 1 WHERE title LIKE '%плёнк%';
