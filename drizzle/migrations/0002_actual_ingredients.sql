-- Migration: Tambah kolom is_actual pada tabel ingredients
-- Untuk membedakan bahan menu usulan (0) dan bahan menu sebenarnya (1)
-- Jalankan SQL ini di Cloudflare Dashboard > D1 > mbg-database > Console

ALTER TABLE ingredients ADD COLUMN is_actual INTEGER NOT NULL DEFAULT 0;
