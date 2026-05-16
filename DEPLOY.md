# 🚀 Deploy MBG ke Cloudflare (Free Tier)

## Langkah-langkah

### 1. Install Wrangler CLI
```bash
pnpm add -g wrangler
```

### 2. Login ke Cloudflare
```bash
wrangler login
```

### 3. Buat D1 Database
```bash
wrangler d1 create mbg-database
```

### 4. Update `wrangler.toml`
Copy `database_id` yang didapat dari langkah 3 ke file `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "mbg-database"
database_id = "YOUR_D1_DATABASE_ID"
```

### 5. Set JWT Secret
```bash
wrangler secret put JWT_SECRET
```
Masukkan string secret yang kuat.

### 6. Generate & Apply Migration
```bash
pnpm db:generate
pnpm db:migrate
```

### 7. Build & Deploy
```bash
pnpm deploy
```

### 8. Akses Aplikasi
Buka: `https://mbg-app.[subdomain].workers.dev`

## Environment Variables

| Variable | Deskripsi |
|----------|-----------|
| `JWT_SECRET` | Secret key untuk JWT token (wrangler secret) |
| `DB` | D1 database binding (otomatis dari wrangler.toml) |
