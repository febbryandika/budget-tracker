-- Backfill icon + type for default categories that existed before the
-- icon/type columns were added. The 0001 migration set every row to the
-- column defaults ('tag' / 'expense'), so rows seeded by earlier versions of
-- the app need their proper icon mapping restored.

UPDATE "categories" SET icon = 'utensils',  type = 'expense' WHERE name = 'Food'          AND is_default = 'true' AND icon = 'tag';
UPDATE "categories" SET icon = 'car',       type = 'expense' WHERE name = 'Transport'     AND is_default = 'true' AND icon = 'tag';
UPDATE "categories" SET icon = 'bolt',      type = 'expense' WHERE name = 'Utilities'     AND is_default = 'true' AND icon = 'tag';
UPDATE "categories" SET icon = 'briefcase', type = 'income'  WHERE name = 'Salary'        AND is_default = 'true' AND icon = 'tag';
UPDATE "categories" SET icon = 'film',      type = 'expense' WHERE name = 'Entertainment' AND is_default = 'true' AND icon = 'tag';
UPDATE "categories" SET icon = 'more',      type = 'expense' WHERE name = 'Other'         AND is_default = 'true' AND icon = 'tag';
