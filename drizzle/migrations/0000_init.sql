-- Migration: Create all tables for MBG app
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS weeks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menu_proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_id INTEGER NOT NULL REFERENCES weeks(id),
  proposed_by INTEGER NOT NULL REFERENCES users(id),
  day_of_week TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  menu_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'proposed',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_proposal_id INTEGER NOT NULL REFERENCES menu_proposals(id),
  name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  price_per_unit REAL NOT NULL,
  total_price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_proposal_id INTEGER NOT NULL REFERENCES menu_proposals(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  vote_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_vote ON votes(menu_proposal_id, user_id);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_proposal_id INTEGER NOT NULL REFERENCES menu_proposals(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  parent_id INTEGER,
  content TEXT NOT NULL,
  is_edited INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
