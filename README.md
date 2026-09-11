# ubsc-landing

Situs publik UB Sport Center — `ubsportcenter.co.id`. Berisi beranda dan seluruh halaman marketing, auth customer, booking lapangan & kelas, pembayaran transfer manual, serta riwayat booking.

Repo ini **tidak pernah menyentuh database**. Semua data datang dari `ubsc-api` lewat HTTP.

> **Peringatan R12 — kontrak.**
> Kontrak (DTO response, daftar `PERMISSIONS`, format Rupiah/tanggal) **hanya ditulis di `ubsc-api/shared/`**.
> Folder `src/types/contracts/` di repo ini adalah **salinan AUTO-GENERATED** hasil `npm run sync:contracts`, dan salinan itu **di-commit** supaya build tidak butuh akses ke repo API.
> **Jangan pernah mengeditnya dengan tangan.** Suntingan tangan akan tertimpa pada sync berikutnya, dan sampai saat itu tipe di repo ini tetap hijau di atas kontrak yang salah — mode gagalnya diam dan baru muncul di runtime. Kalau sebuah field kurang, tambahkan di `ubsc-api/shared/`, lalu sync.

## Stack

| Bagian | Versi / paket |
| --- | --- |
| Runtime | Node 24 (dipin lewat `.nvmrc` + `engines`) |
| Framework | Next.js 15 (App Router) + Turbopack saat dev |
| UI | React 19, Tailwind v4 dengan blok kompatibilitas v3, shadcn/ui seperlunya |
| Data per-user | TanStack Query v5 + axios (`src/lib/axios.ts`, interceptor single-flight refresh) |
| Data publik | `fetch` native di `src/services/server.ts` (`import 'server-only'`) dengan `next: { revalidate, tags }` |
| Form | react-hook-form + Zod 4 (schema request memang sengaja diduplikasi dari API, bukan di-share) |
| Scroll | Lenis (`ReactLenis`) |
| Bahasa | TypeScript strict |

CSS animasi bespoke (2.314 baris dari `resources/css/app.css` Laravel) **tetap CSS polos di luar kendali Tailwind**. Itu yang mengimunkan bagian dengan risiko fidelity tertinggi.

## Prasyarat

- **Node 24** dan npm 11.
- **`ubsc-api` harus jalan di `http://localhost:4020`.** Repo ini hanya proxy; tanpa API, halaman yang mengambil data akan kosong.
- **Salinan lokal repo `ubsc-api`** untuk `sync:contracts`. Path-nya dibaca dari variabel `UBSC_API_LOCAL_PATH` di `.env` (default: `../ubsc-api`), jadi cara paling mudah adalah menaruh ketiga repo bersebelahan dalam satu folder induk.
- MySQL tidak dibutuhkan di sini. **Docker juga tidak dipakai di proyek ini** — lihat `ubsc-api/docs/fase-0.md`.

## Setup

```bash
cp .env.example .env          # minimal: API_BASE_URL
npm ci                        # WAJIB npm ci — lockfile ter-commit adalah kontraknya (R17)
npm run sync:contracts        # menyalin ubsc-api/shared ke src/types/contracts lalu tsc --noEmit
```

`package-lock.json` **ter-commit** di repo ini. Boilerplate `STARTER-BMU/FE` meng-`.gitignore` lockfile; baris itu sudah dihapus di Fase 0 pada ketiga repo. Tanpa lockfile, `npm ci` mustahil dan build jadi non-deterministik.

## Menjalankan

```bash
npm run dev              # http://localhost:3000
npm run build            # build produksi
npm start                # menjalankan hasil build di port 3000
npm run lint
npm run typecheck        # tsc --noEmit
npm run format:write
npm run sync:contracts   # jalankan tiap kali ada perubahan di ubsc-api/shared
```

`next.config.ts` mem-proxy `/api/*` dan `/uploads/*` ke `API_BASE_URL` lewat `rewrites()`, sehingga browser selalu bicara same-origin dan cookie httpOnly bekerja tanpa CORS. **Di produksi kedua path itu diterminasi di nginx, bukan diteruskan Next** — `rewrites()` adalah jalur dev.

Saat boot di mode dev, aplikasi membandingkan hash salinan kontraknya dengan `GET /api/meta/contract-hash` dan menulis `console.warn` bila berbeda. Peringatan itu artinya: jalankan `npm run sync:contracts`.

## Struktur folder

```
ubsc-landing/
├── public/                      # hanya aset ringan; media berat TIDAK ikut git (lihat ubsc-api/docs/media.md)
└── src/
    ├── app/                     # shell App Router: page.tsx adalah re-export satu baris + metadata
    │   ├── layout.tsx           # providers, font, Lenis, data global (announcements, gym_traffic)
    │   └── api/revalidate/      # dipanggil API setelah write CMS untuk invalidasi ISR
    ├── features/<domain>/       # kode halaman yang sebenarnya, mis. features/home/page/Index.tsx
    ├── components/              # komponen lintas fitur (ui/ shadcn; layout/ landing dibuat di Fase 4)
    ├── context/                 # AuthContext di root providers — Navbar butuh di semua halaman
    ├── hooks/                   # hooks/api/ untuk TanStack Query
    ├── services/                # server.ts (RSC, server-only) dan service per domain
    ├── lib/                     # axios.ts, cn.ts
    ├── config/                  # routes.ts (URL + route tertutup), api.ts (AUTH_BASE), branches.ts
    ├── types/
    │   └── contracts/           # AUTO-GENERATED dari ubsc-api/shared — JANGAN EDIT
    ├── styles/                  # CSS bespoke di luar Tailwind
    └── utils/
```

Pembagian `app/` sebagai shell dan `features/` sebagai isi adalah konvensi boilerplate, dan di sini ada alasan tambahannya: `metadata` tidak bisa di-export dari berkas `'use client'`, jadi metadata tinggal di shell sementara section beranimasi tetap client leaf.

## Aturan khusus landing

Hal-hal berikut load-bearing untuk fidelity visual. Semuanya keputusan sadar, bukan sisa yang belum dirapikan.

- **Jangan menambah atau menghapus satu pun elemen wrapper** pada section curtain. `.section-two-curtain-edge` diposisikan `bottom: 100%` relatif ke `.section-two-curtain` dengan `overflow-anchor: none` sepanjang rantai; satu `<div>` ekstra melepaskan curtain-nya. Divalidasi dengan DOM-structure diff, bukan pixel diff.
- **Font memakai `@font-face` mentah, bukan `next/font/local`.** `next/font` menghasilkan nama family ter-obfuscate, sementara 21 berkas men-hardcode `font-family: 'Clash Display'` / `'BDO Grotesk'` di CSS yang mereka suntik.
- **Hero memakai `<img>` polos, bukan `next/image`** — state machine-nya bergantung pada `onLoad`/`onError` elemen asli. Gambar **CMS** (thumbnail news, slide promo, logo sponsor, galeri) tetap lewat `next/image`; itu upload user berukuran tak terkendali.
- **Jangan `useSearchParams()`** untuk modal auth (`?auth=login|register`); hook itu memaksa route jadi dinamis dan diam-diam mematikan strategi ISR. Pakai `useEffect` + `new URLSearchParams(window.location.search)` seperti sekarang.
- **Form di AuthModal memakai react-hook-form langsung**, bukan wrapper `<Form>/<FormItem>/<FormControl>` shadcn — `<FormItem>` menyuntik `grid gap-3` dan mengubah box model yang dipakai `.auth-stagger`.
- **Sonner hanya di admin.** Landing memakai `FlashToast` bespoke.
- Semua URL halaman dibangun lewat `src/config/routes.ts`. `typedRoutes` menegakkannya di level tipe.

## Resep menambah fitur

Sama untuk ketiga repo, ikuti persis dan berurutan. Langkah 4 ada karena ini tiga repo terpisah.

1. **Permission** — di `ubsc-api`: `shared/permissions.ts`, `src/config/permissions.ts`, `prisma/seed.ts`.
2. **Domain** — di `ubsc-api`: model Prisma, route di `routes/details/`, controller, service; tambahkan DTO-nya di `shared/contracts.ts`.
3. **Daftarkan route** di `public-api.ts` / `customer-api.ts` / `private-api.ts` sesuai audience-nya.
4. **Di repo ini: `npm run sync:contracts` lebih dulu.** Jangan menulis satu baris pun yang memakai DTO baru sebelum langkah ini jalan.
5. **Halaman** — daftarkan URL-nya di `src/config/routes.ts`, buat halaman di `app/` dengan isinya di `features/`, lalu tambahkan entri navigasi bila halaman itu publik. Kalau halaman itu milik-sendiri customer (bukan publik), tambahkan juga polanya ke `PROTECTED_ROUTE_PREFIXES` / `PROTECTED_ROUTE_PATTERNS` di berkas yang sama — itu satu-satunya daftar yang dibaca `src/middleware.ts`. (Langkah `src/config/permissions.ts`, `app/(protected)/`, dan menu `Sidebar.tsx` pada resep aslinya adalah bagian `ubsc-admin`: landing tidak punya RBAC staff.)

## Catatan versi

Dua paket **sengaja dipin ke versi yang sama dengan aplikasi Laravel**, lebih rendah dari `latest`. Keduanya bukan kelalaian — menaikkannya sebelum kodenya di-port berarti mengubah tampilan tanpa alat untuk melihat perubahannya.

| Paket | Pin di sini | Kenapa |
| --- | --- | --- |
| `maplibre-gl` | `^5.24.0` | `src/components/map.tsx` Laravel ditulis untuk API v5 dan **belum di-port** (Fase 5). v6 adalah kandidat upgrade terpisah yang harus diuji bersama porting peta itu, bukan dinaikkan diam-diam. |
| `lucide-react` | `^0.454.0` | Membandingkan data path SVG 0.454.0 lawan 1.44.0 untuk 151 ikon yang benar-benar dipakai aplikasi Laravel: **53 di antaranya digambar ulang** di v1. Gate penerimaan Fase 4/5 adalah screenshot diff lawan situs Laravel, jadi ikon yang berubah bentuk langsung terbaca sebagai regresi. Semua nama ikon yang dipakai memang ada di kedua versi — yang berbeda gambarnya, bukan ketersediaannya. |

**Advisory yang menempel pada pin maplibre v5 — catat, jangan diabaikan.** `npm audit` melaporkan [GHSA-jrc7-96c5-q579](https://github.com/advisories/GHSA-jrc7-96c5-q579) (severity *critical*, kena `maplibre-gl <= 6.4.0`, jadi **tidak ada rilis 5.x yang bersih**): bypass sanitizer di `DOM.sanitize()` yang berujung XSS lewat konten popup. Keadaan hari ini: **belum ada satu berkas pun di `src/` yang mengimpor maplibre**, jadi nol baris kodenya masuk bundle mana pun. Yang harus terjadi di Fase 5, sebelum peta dinyalakan: naikkan ke v6 bersama porting `map.tsx` (satu-satunya jalan keluar dari advisory ini), atau pastikan seluruh isi popup berasal dari konstanta repo, bukan dari CMS/input pengguna. **Jangan menganggap masalah ini selesai hanya karena `npm audit` sempat hijau saat paketnya dipin v6.**

Temuan `npm audit` lain adalah `postcss` yang ter-bundle **di dalam `next`**, bukan dependency langsung repo ini; hilang sendiri saat `next` naik versi. **Jangan `npm audit fix --force`** — perintah itu akan menarik `next` 16 dan maplibre v6 sekaligus, dua perubahan besar yang tidak diminta Rewrite.md.

Yang **sengaja lebih tinggi** dari aplikasi Laravel dan tidak boleh diturunkan, karena Rewrite.md memang memintanya: `motion ^12` (rename dari `framer-motion ^11`), `lenis ^1.3` (pindah dari `@studio-freight/lenis`), `tailwind-merge ^3` (syarat class awareness Tailwind v4), `tailwindcss ^4`, dan React 19.

## Dokumen terkait

- `ubsc-api/docs/fase-0.md` — deliverable Fase 0 dan gate penerimaannya.
- `ubsc-api/docs/media.md` — kebijakan aset berat; wajib dibaca sebelum menambahkan gambar atau video ke `public/`.
- `Rewrite.md` di repo Laravel lama — dokumen rencana lengkap.
