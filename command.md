# 🍱 MBG – Makanan Bergizi Guys
## GitHub Copilot Prompt — Full Stack Monolith App

---

## 🎯 OVERVIEW

Buat aplikasi web full-stack bernama **MBG (Makanan Bergizi Guys)** — sebuah platform manajemen menu makanan mingguan untuk kelompok orang yang masak bersama. Desain harus **cerah, modern, dan futuristik** — gunakan warna-warna vivid, gradient, glow effect, font sans-serif yang clean dan bold.

---

## 🏗️ TECH STACK (MONOLITH — SATU REPO)

```
Stack:
- Runtime      : Cloudflare Workers
- Framework    : Hono.js (backend API + serve static)
- Database     : Cloudflare D1 (SQLite, built-in Cloudflare)
- ORM/Query    : Drizzle ORM (dengan D1 adapter)
- Frontend     : React 18 + Vite (di-build ke static, di-serve oleh Hono)
- Styling      : Tailwind CSS v3
- Auth         : JWT (jsonwebtoken / jose) — cookie-based
- Excel Export : SheetJS (xlsx)
- Deploy       : Cloudflare Pages + Workers (free tier)
- Package Mgr  : pnpm
```

### Struktur Folder Monolith:
```
mbg-app/
├── src/
│   ├── api/               # Hono backend routes
│   │   ├── index.ts       # Entry point Hono app
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── menus.ts
│   │   │   ├── ingredients.ts
│   │   │   ├── votes.ts
│   │   │   ├── comments.ts
│   │   │   └── export.ts
│   │   ├── middleware/
│   │   │   └── auth.ts    # JWT middleware
│   │   └── db/
│   │       ├── schema.ts  # Drizzle schema
│   │       └── migrate.ts
│   ├── client/            # React frontend
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── MenuProposalPage.tsx
│   │   │   ├── MenuDetailPage.tsx   # halaman detail menu + komentar
│   │   │   ├── WeeklyPlanPage.tsx
│   │   │   └── RecapPage.tsx
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── MenuCard.tsx
│   │   │   ├── VoteButton.tsx
│   │   │   ├── IngredientTable.tsx
│   │   │   ├── PriceRecap.tsx
│   │   │   └── CommentSection.tsx  # chat/catatan per menu
│   │   └── lib/
│   │       ├── api.ts     # fetch wrapper ke Hono API
│   │       └── auth.ts    # auth context/store
├── drizzle/
│   └── migrations/        # Auto-generated SQL migrations
├── public/
├── wrangler.toml          # Cloudflare config
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🗄️ DATABASE SCHEMA (Drizzle ORM + D1)

Buat schema di `src/api/db/schema.ts`:

```typescript
// USERS
users: {
  id          : integer (PK, autoincrement)
  username    : text (unique, not null)
  displayName : text (not null)
  password    : text (not null, bcrypt-hashed)
  createdAt   : text (ISO timestamp)
}

// WEEKS — represent minggu rencana makan
weeks: {
  id          : integer (PK, autoincrement)
  label       : text  // e.g. "Minggu 20 – 26 Mei 2025"
  startDate   : text  // ISO date
  endDate     : text
  createdBy   : integer (FK → users.id)
  createdAt   : text
}

// MENU PROPOSALS — usulan menu per hari dalam minggu
menuProposals: {
  id          : integer (PK, autoincrement)
  weekId      : integer (FK → weeks.id)
  proposedBy  : integer (FK → users.id)
  dayOfWeek   : text   // "Senin" | "Selasa" | ... | "Minggu"
  mealType    : text   // "Sarapan" | "Makan Siang" | "Makan Malam"
  menuName    : text
  description : text
  status      : text   // "proposed" | "approved" | "rejected"
  createdAt   : text
}

// INGREDIENTS — bahan makanan per menu
ingredients: {
  id            : integer (PK, autoincrement)
  menuProposalId: integer (FK → menuProposals.id)
  name          : text    // nama bahan
  quantity      : real    // jumlah
  unit          : text    // "gram" | "kg" | "liter" | "buah" | "sdm" | dst
  pricePerUnit  : real    // harga per unit (Rupiah)
  totalPrice    : real    // computed: quantity * pricePerUnit
}

// VOTES — vote menu proposal
votes: {
  id              : integer (PK, autoincrement)
  menuProposalId  : integer (FK → menuProposals.id)
  userId          : integer (FK → users.id)
  voteType        : text   // "up" | "down"
  createdAt       : text
  UNIQUE(menuProposalId, userId) — satu user satu vote per menu
}

// COMMENTS — catatan/diskusi per menu (seperti chat)
comments: {
  id              : integer (PK, autoincrement)
  menuProposalId  : integer (FK → menuProposals.id)
  userId          : integer (FK → users.id)
  parentId        : integer (FK → comments.id, nullable) // untuk reply/thread
  content         : text (not null)                       // isi catatan/komentar
  isEdited        : integer (boolean, default 0)
  createdAt       : text (ISO timestamp)
  updatedAt       : text (ISO timestamp)
}
```

---

## 🔐 AUTH SYSTEM

- **Register**: `POST /api/auth/register`
  - Fields: `username`, `password`, `displayName`
  - Hash password dengan `bcryptjs`
  - Validasi: username unik, password min 6 karakter
  - Return JWT token (simpan di httpOnly cookie)

- **Login**: `POST /api/auth/login`
  - Fields: `username`, `password`
  - Verifikasi password hash
  - Return JWT token (httpOnly cookie, expires 7 hari)

- **Logout**: `POST /api/auth/logout` — clear cookie

- **Me**: `GET /api/auth/me` — return current user dari JWT

- **Update Profile**: `PATCH /api/auth/profile` — update `displayName`

> ⚠️ TIDAK ADA verifikasi email. Registrasi langsung aktif.

---

## 🍽️ API ENDPOINTS

### Weeks (Rencana Minggu)
```
GET    /api/weeks              — list semua minggu
POST   /api/weeks              — buat minggu baru (auto-generate label dari tanggal)
GET    /api/weeks/:id          — detail minggu beserta semua menu proposal
GET    /api/weeks/current      — minggu yang sedang aktif (berdasarkan tanggal hari ini)
```

### Menu Proposals
```
GET    /api/weeks/:weekId/menus         — list semua proposal di minggu tsb
POST   /api/weeks/:weekId/menus         — buat proposal menu baru
GET    /api/menus/:id                   — detail menu + ingredients
PATCH  /api/menus/:id                   — edit menu (hanya oleh proposer)
DELETE /api/menus/:id                   — hapus menu (hanya oleh proposer)
PATCH  /api/menus/:id/status            — approve/reject (bisa oleh siapa saja, atau bisa dibatasi)
```

### Ingredients
```
GET    /api/menus/:menuId/ingredients   — list bahan makanan
POST   /api/menus/:menuId/ingredients   — tambah bahan
PATCH  /api/ingredients/:id             — edit bahan (nama, qty, harga)
DELETE /api/ingredients/:id             — hapus bahan
```

### Votes
```
POST   /api/menus/:menuId/vote          — vote up/down (toggle jika sudah vote)
GET    /api/menus/:menuId/votes         — lihat vote summary
```

### Comments (Catatan/Chat per Menu)
```
GET    /api/menus/:menuId/comments      — list semua komentar di menu tsb (nested: parent + replies)
POST   /api/menus/:menuId/comments      — kirim komentar baru
POST   /api/comments/:id/reply          — balas komentar tertentu (thread)
PATCH  /api/comments/:id               — edit komentar (hanya oleh author, isEdited = true)
DELETE /api/comments/:id               — hapus komentar (hanya oleh author)
```

**Aturan Comments:**
- Komentar di-load berurutan dari terlama ke terbaru (ASC createdAt)
- Reply di-nest di bawah parent, maksimal 1 level saja (tidak perlu deep nesting)
- Jika komentar diedit, tampilkan label kecil "(diedit)" di samping timestamp
- Jika komentar dihapus oleh author, tampilkan placeholder teks *"Komentar ini telah dihapus"* agar thread tidak putus — jangan hard delete, tambahkan kolom `deletedAt` (nullable) dan soft delete
- Sertakan total comment count di response detail menu (`GET /api/menus/:id`)

### Export
```
GET    /api/weeks/:weekId/export        — download Excel rekap mingguan
```

---

## 📊 FITUR EXCEL EXPORT

Gunakan library **SheetJS (xlsx)** di sisi server (Hono route `/api/weeks/:weekId/export`).

Excel file harus memiliki **multiple sheets**:

**Sheet 1: "Rekap Menu Mingguan"**
| Hari | Jenis Makan | Nama Menu | Diusulkan Oleh | Vote ↑ | Vote ↓ | Komentar | Status |
|------|-------------|-----------|---------------|--------|--------|----------|--------|

**Sheet 2: "Daftar Bahan Makanan"**
| Menu | Nama Bahan | Jumlah | Satuan | Harga/Satuan | Total Harga |
|------|------------|--------|--------|-------------|-------------|

**Sheet 3: "Rekap Harga"**
| Menu | Total Harga Bahan |
|------|------------------|
| **GRAND TOTAL** | **Rp xxx.xxx** |

Format angka: Rupiah (IDR), gunakan `Intl.NumberFormat('id-ID')`.

Response headers: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment; filename="MBG-Rekap-[label].xlsx"`

---

## 🎨 DESAIN UI (FUTURISTIK + CERAH)

### Palet Warna:
```css
--primary    : #00E5FF   /* cyan neon */
--secondary  : #FF6B35   /* orange vivid */
--accent     : #A259FF   /* purple electric */
--bg-dark    : #0A0F1E   /* dark navy */
--bg-card    : #111827   /* card dark */
--bg-glass   : rgba(255,255,255,0.05)  /* glassmorphism */
--text-main  : #F0F6FF
--text-muted : #8892A4
--success    : #00FF88
--danger     : #FF4560
```

### Komponen Desain:
- **Glassmorphism cards** — `backdrop-filter: blur(12px)`, border transparan
- **Neon glow** pada elemen aktif — `box-shadow: 0 0 20px var(--primary)`
- **Gradient background** — dark navy dengan subtle radial gradient cyan/purple
- **Animasi smooth** — transisi 200-300ms ease, hover lift effect
- **Font**: `Sora` atau `Plus Jakarta Sans` untuk heading, `Inter` untuk body (import dari Google Fonts)
- **Tombol**: rounded-full dengan gradient, hover glow effect
- **Vote buttons**: animated thumbs up/down dengan counter

### Halaman:

**1. Login & Register Page**
- Centered card dengan glassmorphism
- Logo MBG dengan icon emoji 🥗 dan nama bergradient
- Simple form: username, password, (register: displayName)
- Toggle antara Login dan Register

**2. Dashboard**
- Greeting: "Halo, [displayName]! 👋"
- Card ringkasan minggu aktif: jumlah menu, total harga perkiraan
- Quick-action buttons: "Usulkan Menu", "Lihat Rencana Minggu Ini"
- Recent proposals dengan status badge

**3. Weekly Plan Page (`/week/:id`)**
- Tampilkan dalam grid 7 kolom (Senin-Minggu)
- Tiap hari: card yang bisa berisi Sarapan, Makan Siang, Makan Malam
- Setiap menu card: nama menu, badge status, vote count, tombol vote
- Filter/sort by: hari, jenis makan, vote terbanyak
- Tombol "Export Excel" di pojok kanan atas

**4. Menu Proposal Page**
- Form: pilih minggu, pilih hari, pilih jenis makan, nama menu, deskripsi
- Setelah simpan: bisa langsung tambah bahan makanan (inline form)
- Tabel bahan: nama | qty | satuan | harga/unit | total (auto-kalkulasi)
- Total harga menu otomatis terhitung

**5. Menu Detail Page (`/menus/:id`)** ← **HALAMAN BARU**
- Info lengkap menu: nama, hari, jenis makan, status, proposer
- Tombol Vote (up/down) + jumlah vote
- Tabel bahan makanan + total harga
- **Seksi Catatan/Komentar** (seperti chat):
  - Header: "💬 Catatan & Diskusi (N komentar)"
  - List komentar tampil seperti bubble chat:
    - Avatar inisial (dari displayName) berwarna unik per user
    - DisplayName + timestamp relatif (e.g. "2 jam lalu")
    - Isi komentar
    - Label kecil *(diedit)* jika sudah diedit
    - Tombol "Balas" untuk reply
    - Tombol "Edit" dan "Hapus" (hanya muncul untuk author sendiri)
  - Reply tampil indent di bawah parent dengan garis vertikal neon kiri
  - Komentar yang dihapus tampil sebagai teks abu-abu miring: *"Komentar ini telah dihapus"*
  - Input area di bawah: textarea auto-resize + tombol "Kirim" (shortcut: Ctrl+Enter)
  - Real-time feel: setelah kirim komentar, langsung muncul tanpa reload halaman (optimistic update)
  - Scroll otomatis ke komentar terbaru saat buka halaman
  - Badge jumlah komentar juga tampil di MenuCard pada WeeklyPlanPage

**6. Rekap Page**
- Tabel agregat semua bahan per minggu
- Total harga per menu dan grand total
- Tombol "Download Excel"

**7. Navbar**
- Logo MBG kiri
- Navigation links tengah
- User avatar/displayName + dropdown (Profile, Logout) kanan
- Mobile: hamburger menu

---

## ⚙️ KONFIGURASI CLOUDFLARE

### `wrangler.toml`:
```toml
name = "mbg-app"
main = "src/api/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "mbg-database"
database_id = "REPLACE_WITH_YOUR_D1_ID"

[site]
bucket = "./dist"
```

### Build & Deploy:
```json
// package.json scripts:
{
  "scripts": {
    "dev"       : "concurrently \"wrangler dev\" \"vite\"",
    "build"     : "vite build && wrangler deploy",
    "db:migrate": "wrangler d1 migrations apply mbg-database",
    "db:studio" : "drizzle-kit studio"
  }
}
```

### Vite config — proxy API ke Wrangler dev server:
```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:8787'
  }
}
```

---

## 🔒 KEAMANAN & BEST PRACTICES

- Password hashing: `bcryptjs` dengan salt rounds 10
- JWT secret: simpan di Cloudflare Worker secret (`wrangler secret put JWT_SECRET`)
- JWT di httpOnly cookie (tidak bisa diakses JS)
- CORS: hanya izinkan origin yang sama
- Input validation: validasi semua input di sisi server dengan `zod`
- Rate limiting: minimal di endpoint auth (gunakan Cloudflare built-in atau simple in-memory counter)
- SQL injection: aman karena Drizzle ORM menggunakan parameterized queries

---

## 📦 DEPENDENCIES

```json
{
  "dependencies": {
    "hono"            : "^4.x",
    "@hono/zod-validator": "^0.x",
    "drizzle-orm"     : "^0.x",
    "bcryptjs"        : "^2.x",
    "jose"            : "^5.x",
    "xlsx"            : "^0.18.x",
    "zod"             : "^3.x",
    "react"           : "^18.x",
    "react-dom"       : "^18.x",
    "react-router-dom": "^6.x",
    "zustand"         : "^4.x"
  },
  "devDependencies": {
    "vite"            : "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss"     : "^3.x",
    "drizzle-kit"     : "^0.x",
    "wrangler"        : "^3.x",
    "typescript"      : "^5.x",
    "concurrently"    : "^8.x"
  }
}
```

---

## 🚀 CARA DEPLOY KE CLOUDFLARE (FREE TIER)

Sertakan file `DEPLOY.md` dengan instruksi:

```markdown
1. Install Wrangler CLI: `pnpm add -g wrangler`
2. Login Cloudflare: `wrangler login`
3. Buat D1 database: `wrangler d1 create mbg-database`
4. Copy database_id ke wrangler.toml
5. Set JWT secret: `wrangler secret put JWT_SECRET`
6. Jalankan migrasi: `pnpm db:migrate`
7. Build & deploy: `pnpm build`
8. Akses di: https://mbg-app.[subdomain].workers.dev
```

---

## 📋 URUTAN PEMBUATAN (untuk Copilot)

Buat dalam urutan berikut:
1. Setup project (wrangler.toml, vite.config, tailwind, tsconfig)
2. Database schema (Drizzle) + migration SQL
3. Hono backend: middleware auth, lalu routes (auth → weeks → menus → ingredients → votes → comments → export)
4. React frontend: setup routing, auth context, lalu halaman (Login → Register → Dashboard → WeeklyPlan → MenuProposal → MenuDetail → Rekap)
5. Komponen UI dengan styling Tailwind futuristik
6. Export Excel endpoint
7. File README.md dan DEPLOY.md

---

> **Catatan untuk Copilot**: Buat seluruh kode yang **production-ready**, bukan placeholder. Semua fungsi harus benar-benar bekerja. Gunakan TypeScript strict mode. Tambahkan komentar pada logika yang kompleks. Pastikan mobile-responsive.