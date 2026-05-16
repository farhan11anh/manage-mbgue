-- Migration: Add actual_menu_name column
ALTER TABLE menu_proposals ADD COLUMN actual_menu_name TEXT;
