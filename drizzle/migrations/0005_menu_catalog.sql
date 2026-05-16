-- Menu catalog table
CREATE TABLE IF NOT EXISTS menu_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  recipe TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Catalog ingredients table
CREATE TABLE IF NOT EXISTS catalog_ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  catalog_menu_id INTEGER NOT NULL REFERENCES menu_catalog(id),
  name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  price_per_unit REAL NOT NULL,
  total_price REAL NOT NULL
);

-- Add catalog_menu_id and note to menu_proposals
ALTER TABLE menu_proposals ADD COLUMN catalog_menu_id INTEGER REFERENCES menu_catalog(id);
ALTER TABLE menu_proposals ADD COLUMN note TEXT;
