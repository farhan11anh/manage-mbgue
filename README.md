# 🍱 MBG — Makanan Bergizi Guys

Platform manajemen menu makanan mingguan untuk kelompok orang yang masak bersama.

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Backend**: Hono.js
- **Database**: Cloudflare D1 (SQLite) + Drizzle ORM
- **Frontend**: React 18 + Vite + Tailwind CSS v3
- **Auth**: JWT (jose) — cookie-based
- **Export**: SheetJS (xlsx)
- **Package Manager**: pnpm

## Fitur

- 🔐 Register & Login (JWT httpOnly cookie)
- 📅 Manajemen rencana minggu
- 🍽️ Usulan menu per hari (Sarapan/Makan Siang/Makan Malam)
- 🥬 Bahan makanan dengan harga per menu
- 👍👎 Voting menu
- 💬 Komentar/diskusi per menu (reply, edit, soft-delete)
- 📊 Export rekap mingguan ke Excel
- 🎨 UI futuristik dengan glassmorphism & neon glow

## Development

```bash
# Install dependencies
pnpm install

# Run dev server (Wrangler + Vite)
pnpm dev

# Build for production
pnpm build

# Generate DB migration
pnpm db:generate

# Apply migration
pnpm db:migrate
```

## Lihat [DEPLOY.md](./DEPLOY.md) untuk instruksi deploy ke Cloudflare.
