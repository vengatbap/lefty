ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0);
