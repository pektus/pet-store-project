-- Normalize category values so they match the SupplyCategory enum names.
UPDATE supplies
SET category = UPPER(BTRIM(category))
WHERE category <> UPPER(BTRIM(category));
