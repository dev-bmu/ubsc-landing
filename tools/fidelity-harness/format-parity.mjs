// ===== Paritas format angka & tanggal: TSX Laravel -> shared/format.ts =====
//
// Laravel tidak punya formatter terpusat: 44 pemanggilan Intl/toLocale* tersebar di TSX dengan opsi berbeda-beda.
// R13 mewajibkan satu implementasi (shared/format.ts), gate visual mewajibkan karakter yang sama persis — termasuk
// jenis spasi (style 'currency' IDR menyisipkan NBSP U+00A0 setelah "Rp").
//
// Script ini memegang TABEL PORT: setiap kelompok pemanggilan Laravel (berkas:baris) -> ekspresi port. Kedua sisi
// DIEKSEKUSI pada nilai contoh dan dibandingkan per karakter:
//   - sisi Laravel dijalankan dengan semantik browser: zona lokal = zona pengunjung. Rujukannya pengunjung WIB
//     (R13). Pola tanggal kalender (new Date(y, m, d), `${tgl}T12:00:00`) juga dijalankan di zona lain untuk
//     membuktikan bahwa di Laravel pola itu memang tidak bergantung zona;
//   - sisi port dijalankan di SETIAP zona uji (SSR dan browser bisa di zona mana pun) dan harus selalu sama dengan
//     rujukan WIB.
// Nilai di kabel ikut dimodelkan: Laravel mengirim created_at sebagai jam dinding Jakarta tanpa offset dan cast
// 'date' sebagai tengah malam Jakarta dalam UTC, ubsc-api mengirim instan ISO UTC dan kunci "YYYY-MM-DD".
//
// Dengan argumen ketiga, setiap pemanggilan Intl/toLocale* di TSX Laravel wajib tercantum di tabel (atau di daftar
// berkas mati) — pemanggilan baru yang belum dipetakan membuat script gagal.
//
// Bagian JEBAKAN berisi substitusi yang tampak wajar tetapi TIDAK setara; dicetak supaya alasan tabel terlihat.
//
// Pemakaian: node format-parity.mjs <shared/format.ts> <laporan.json> [resources/js Laravel]
// Exit 1 bila ada baris tabel yang tidak setara atau pemanggilan Laravel yang belum dipetakan.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const [, , formatTsPath, outPath, laravelJs] = process.argv
if (!formatTsPath || !outPath) {
  console.error('Pemakaian: node format-parity.mjs <shared/format.ts> <laporan.json> [resources/js Laravel]')
  process.exit(2)
}

// shared/format.ts TypeScript murni tanpa dependensi — cukup buang tipenya dengan transpileModule dari typescript
// milik ubsc-landing (harness tidak memasang typescript sendiri).
const require = createRequire(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../package.json'))
const ts = require('typescript')
const js = ts.transpileModule(fs.readFileSync(formatTsPath, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
const tmp = `${outPath}.format.mjs`
fs.writeFileSync(tmp, js)
const fmt = await import(pathToFileURL(path.resolve(tmp)).href)
fs.rmSync(tmp, { force: true })

// ===== Zona & nilai uji =====

const WIB = 'Asia/Jakarta'
// WIB, WITA, WIT, UTC (server), barat jauh, UTC+14 dan UTC-11 (tepi ekstrem pergeseran hari).
const ZONES = [WIB, 'Asia/Makassar', 'Asia/Jayapura', 'UTC', 'America/Los_Angeles', 'Pacific/Kiritimati', 'Pacific/Pago_Pago']

/** Jalankan fn dengan zona waktu proses = tz. Node membaca ulang process.env.TZ di setiap platform. */
const inZone = (tz, fn) => {
  const previous = process.env.TZ
  process.env.TZ = tz
  try {
    return fn()
  } finally {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
  }
}

const INTEGERS = [0, 5, 54, 999, 1000, 1189, 1570, 25000, 150000, 1500000, 123456789, -2500]
const REALS = [...INTEGERS, 0.25, 1.05, 2.45, 12.349, 99.95, 1234.5, -0.04, 2.5e9 / 1e9]
// Instan UTC. 16.30Z = 23.30 WIB dan 17.30Z = 00.30 WIB esok hari: tanggal UTC dan Jakarta berbeda.
const INSTANTS = ['2026-10-05T01:00:00Z', '2026-10-05T16:30:00Z', '2026-12-31T17:30:00Z', '2026-02-28T23:59:59Z', '2024-02-29T12:00:00Z']
const DATE_KEYS = ['2026-10-05', '2026-01-01', '2026-12-31', '2024-02-29', '2026-03-29']

const pad = (n) => String(n).padStart(2, '0')
const keyParts = (key) => key.split('-').map(Number)

// Bentuk nilai tanggal di kabel Laravel (APP_TIMEZONE=Asia/Jakarta).
/** ->toDateTimeString(): jam dinding Jakarta tanpa offset, "2026-10-05 23:30:00". */
const laravelDateTimeString = (iso) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: WIB, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(iso))
/** Cast 'date' yang di-json_encode mentah: Carbon::toJSON() = tengah malam Jakarta dalam UTC, "2026-10-04T17:00:00.000000Z". */
const laravelDateJson = (key) => {
  const [y, m, d] = keyParts(key)
  return new Date(Date.UTC(y, m - 1, d) - 7 * 3600 * 1000).toISOString().replace('.000Z', '.000000Z')
}

const LONG = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }

// ===== Tabel port =====
// kind: 'number' (tanpa zona) | 'instant' (Laravel di WIB, port di semua zona) | 'calendar' (Laravel DAN port di semua zona)
// Untuk input berbentuk { laravel, port }, tiap sisi menerima bentuk kabelnya sendiri.

const CASES = [
  {
    id: 'N1',
    laravel: '"Rp " + n.toLocaleString("id-ID")  ·  `Rp ${n.toLocaleString("id-ID")}`',
    port: 'formatRupiah(n)',
    domain: 'bilangan bulat — semua kolom uang Int di schema.prisma (Transaction.amount cast integer di Laravel)',
    sites: [
      'Pages/Bookings/Payment.tsx:61',
      'lib/calendar.ts:108',
      'Pages/Bookings/History.tsx:34',
      'Components/Landing/Navbar.tsx:1326',
      'Pages/Admin/CheckIn/Show.tsx:25',
      'Pages/Admin/CheckIn/Index.tsx:30',
      'Pages/Admin/Bookings/Index.tsx:74',
      'Pages/Admin/Facilities/Pricing.tsx:170',
      'Components/Booking/BookingListItem.tsx:65',
      'Pages/Admin/Payments/Index.tsx:32',
      'Pages/Admin/MembershipPlans/Index.tsx:111',
      'Pages/Admin/Memberships/Index.tsx:180'
    ],
    kind: 'number',
    inputs: INTEGERS,
    run: (n) => 'Rp ' + n.toLocaleString('id-ID'),
    call: (n) => fmt.formatRupiah(n)
  },
  {
    id: 'N2',
    laravel: '"Rp " + new Intl.NumberFormat("id-ID").format(n)',
    port: 'formatRupiah(n)',
    domain: 'bilangan bulat (nominal transaksi)',
    sites: ['Components/UserDashboard/PaymentHistoryModal.tsx:46'],
    kind: 'number',
    inputs: INTEGERS,
    run: (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n),
    call: (n) => fmt.formatRupiah(n)
  },
  {
    id: 'N3',
    laravel: 'n.toLocaleString("id-ID")  ·  new Intl.NumberFormat("id-ID").format(n)',
    port: 'formatNumberID(n)',
    domain: 'bilangan bulat (hitungan, harga plan, sisa < 1.000 pada formatter ringkas; Payments:201 = Number(head), teks "Rp " JSX tetap)',
    sites: [
      'Pages/Admin/Finance/Index.tsx:436',
      'Pages/Admin/Finance/Index.tsx:440',
      'Pages/Admin/Dashboard.tsx:100',
      'Pages/Admin/Dashboard.tsx:2103',
      'Components/Landing/SectionTwo.tsx:113',
      'Pages/Admin/Payments/Index.tsx:201'
    ],
    kind: 'number',
    inputs: INTEGERS,
    run: (n) => [n.toLocaleString('id-ID'), new Intl.NumberFormat('id-ID').format(n)],
    call: (n) => fmt.formatNumberID(n)
  },
  {
    id: 'N4',
    laravel: '(amount / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })',
    port: 'formatNumberID(amount / 1_000)',
    domain: 'bilangan real',
    sites: ['Pages/Admin/Finance/Index.tsx:424', 'Pages/Admin/Finance/Index.tsx:434', 'Pages/Admin/Dashboard.tsx:98'],
    kind: 'number',
    inputs: REALS,
    run: (n) => n.toLocaleString('id-ID', { maximumFractionDigits: 0 }),
    call: (n) => fmt.formatNumberID(n)
  },
  {
    id: 'N5',
    laravel: 'x.toLocaleString("id-ID", { maximumFractionDigits: 1 })',
    port: 'formatNumberIntl(x, { maximumFractionDigits: 1 })',
    domain: 'bilangan real (nominal ringkas M/JT, persentase tren)',
    sites: [
      'Pages/Admin/Finance/Index.tsx:418',
      'Pages/Admin/Finance/Index.tsx:421',
      'Pages/Admin/Finance/Index.tsx:431',
      'Pages/Admin/Finance/Index.tsx:556',
      'Pages/Admin/Finance/Index.tsx:711',
      'Pages/Admin/Dashboard.tsx:95'
    ],
    kind: 'number',
    inputs: REALS,
    run: (n) => n.toLocaleString('id-ID', { maximumFractionDigits: 1 }),
    call: (n) => fmt.formatNumberIntl(n, { maximumFractionDigits: 1 })
  },
  {
    id: 'N6',
    laravel: 'new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)',
    port: "formatNumberIntl(n, { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })",
    domain: 'bilangan real (NBSP setelah "Rp" ikut)',
    sites: ['Pages/Admin/Finance/Index.tsx:413', 'Pages/Admin/Dashboard.tsx:104', 'Pages/Admin/Dashboard.tsx:2102'],
    kind: 'number',
    inputs: REALS,
    run: (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n),
    call: (n) => fmt.formatNumberIntl(n, { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
  },
  {
    id: 'N7',
    laravel: 'place.reviews.toLocaleString()  (tanpa locale — rujukan: browser id-ID)',
    port: 'formatNumberID(place.reviews)',
    domain: 'bilangan bulat. Browser en-US di Laravel menampilkan "1,570"; port mengunci id-ID (R13), jadi screenshot-diff Fase 4+ wajib locale id-ID',
    sites: ['Components/Landing/LocationMap.tsx:113'],
    kind: 'number',
    inputs: INTEGERS,
    run: (n) => n.toLocaleString('id-ID'),
    call: (n) => fmt.formatNumberID(n)
  },
  {
    id: 'D1',
    laravel: 'new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(year, m - 1, 1))',
    port: "formatCalendarDateIntl(`${monthKey}-01`, { month: 'long', year: 'numeric' })",
    domain: 'kunci bulan "YYYY-MM"',
    sites: ['Components/Booking/Class/ClassMonthPicker.tsx:396'],
    kind: 'calendar',
    inputs: DATE_KEYS,
    run: (key) => {
      const [y, m] = keyParts(key)
      return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1))
    },
    call: (key) => fmt.formatCalendarDateIntl(`${key.slice(0, 7)}-01`, { month: 'long', year: 'numeric' })
  },
  {
    id: 'D2',
    laravel: 'LONG_DATE.format(new Date(`${dateStr}T12:00:00`))  — LONG_DATE = { weekday: "long", day: "numeric", month: "long", year: "numeric" }',
    port: "formatCalendarDateIntl(dateStr, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })",
    domain: 'kunci tanggal "YYYY-MM-DD"',
    sites: ['lib/calendar.ts:89'],
    kind: 'calendar',
    inputs: DATE_KEYS,
    run: (key) => new Intl.DateTimeFormat('id-ID', LONG).format(new Date(`${key}T12:00:00`)),
    call: (key) => fmt.formatCalendarDateIntl(key, LONG)
  },
  {
    id: 'D3',
    laravel: 'SHORT_DATE.format(new Date(`${dateStr}T12:00:00`))  — SHORT_DATE = { day: "numeric", month: "short" }',
    port: "formatCalendarDateIntl(dateStr, { day: 'numeric', month: 'short' })",
    domain: 'kunci tanggal "YYYY-MM-DD"',
    sites: ['lib/calendar.ts:96'],
    kind: 'calendar',
    inputs: DATE_KEYS,
    run: (key) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(`${key}T12:00:00`)),
    call: (key) => fmt.formatCalendarDateIntl(key, { day: 'numeric', month: 'short' })
  },
  {
    id: 'D4',
    laravel: 'new Date(y, m - 1, d).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })',
    port: "formatCalendarDateIntl(dateStr, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })",
    domain: 'kunci tanggal "YYYY-MM-DD"',
    sites: ['Pages/Admin/Bookings/Index.tsx:87', 'Pages/Admin/Memberships/Index.tsx:196'],
    kind: 'calendar',
    inputs: DATE_KEYS,
    run: (key) => {
      const [y, m, d] = keyParts(key)
      return new Date(y, m - 1, d).toLocaleDateString('id-ID', LONG)
    },
    call: (key) => fmt.formatCalendarDateIntl(key, LONG)
  },
  {
    id: 'D5',
    laravel: 'new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })',
    port: "formatCalendarDateIntl(dateStr, { day: 'numeric', month: 'short', year: 'numeric' })",
    domain: 'kunci tanggal "YYYY-MM-DD"',
    sites: ['Pages/Admin/Memberships/Index.tsx:186'],
    kind: 'calendar',
    inputs: DATE_KEYS,
    run: (key) => {
      const [y, m, d] = keyParts(key)
      return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    },
    call: (key) => fmt.formatCalendarDateIntl(key, { day: 'numeric', month: 'short', year: 'numeric' })
  },
  {
    id: 'D6',
    laravel: 'new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "numeric", month: "short" })',
    port: "formatCalendarDateIntl(dateStr, { day: 'numeric', month: 'short' })",
    domain: 'kunci tanggal "YYYY-MM-DD"',
    sites: ['Pages/Admin/Settings/Schedules/Index.tsx:151'],
    kind: 'calendar',
    inputs: DATE_KEYS,
    run: (key) => {
      const [y, m, d] = keyParts(key)
      return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    },
    call: (key) => fmt.formatCalendarDateIntl(key, { day: 'numeric', month: 'short' })
  },
  {
    id: 'D7',
    laravel: 'new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })',
    port: "formatDateIntl(new Date(), { day: '2-digit', month: 'long', year: 'numeric' })",
    domain: 'instan (sekarang)',
    sites: ['Pages/Admin/Dashboard.tsx:2088'],
    kind: 'instant',
    inputs: INSTANTS,
    run: (iso) => new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
    call: (iso) => fmt.formatDateIntl(new Date(iso), { day: '2-digit', month: 'long', year: 'numeric' })
  },
  {
    id: 'D8',
    laravel: 'new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })',
    port: "formatDateIntl(new Date(), { day: '2-digit', month: '2-digit', year: 'numeric' })",
    domain: 'instan (sekarang)',
    sites: ['Pages/Admin/Finance/Index.tsx:1420'],
    kind: 'instant',
    inputs: INSTANTS,
    run: (iso) => new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    call: (iso) => fmt.formatDateIntl(new Date(iso), { day: '2-digit', month: '2-digit', year: 'numeric' })
  },
  {
    id: 'D9',
    laravel: 'new Date(t.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })  — kabel: toDateTimeString()',
    port: "formatDateIntl(createdAt, { day: '2-digit', month: 'short', year: 'numeric' })  — kabel: ISO UTC",
    domain: 'instan transaksi',
    sites: ['Components/UserDashboard/PaymentHistoryModal.tsx:51'],
    kind: 'instant',
    inputs: INSTANTS.map((iso) => ({ label: iso, laravel: laravelDateTimeString(iso), port: iso })),
    run: (wire) => new Date(wire).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    call: (wire) => fmt.formatDateIntl(wire, { day: '2-digit', month: 'short', year: 'numeric' })
  },
  {
    id: 'D10',
    laravel: 'new Date(t.booking_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })  — kabel: cast date mentah',
    port: "formatCalendarDateIntl(bookingDate, { day: '2-digit', month: 'short', year: 'numeric' })  — kabel: \"YYYY-MM-DD\"",
    domain: 'tanggal booking',
    sites: ['Components/UserDashboard/PaymentHistoryModal.tsx:51'],
    kind: 'instant',
    inputs: DATE_KEYS.map((key) => ({ label: key, laravel: laravelDateJson(key), port: key })),
    run: (wire) => new Date(wire).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    call: (wire) => fmt.formatCalendarDateIntl(wire, { day: '2-digit', month: 'short', year: 'numeric' })
  },
  {
    id: 'D11',
    laravel: '`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` (todayStr, nomor laporan LPR/…)',
    port: 'toJakartaDateKey(new Date())',
    domain: 'instan (sekarang) — bukan pemanggilan Intl, tetapi komponen tanggal lokal yang sama rawannya',
    sites: [],
    extraSites: ['lib/calendar.ts:86', 'Pages/Admin/Dashboard.tsx:2089'],
    kind: 'instant',
    inputs: INSTANTS,
    run: (iso) => {
      const d = new Date(iso)
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    },
    call: (iso) => fmt.toJakartaDateKey(new Date(iso))
  }
]

// Berkas yang tidak diimpor dari mana pun — tidak di-port, pemanggilannya tidak masuk tabel.
const DEAD = ['Components/UserDashboard/UserDashboardModal.tsx:173', 'Components/UserDashboard/UserDashboardModal.tsx:178']

// ===== Jebakan: substitusi yang tampak wajar tetapi tidak setara =====

const TRAPS = [
  {
    id: 'T1',
    wrong: 'formatRupiah(n) untuk pola style "currency" IDR',
    why: 'Intl currency menyisipkan NBSP, formatRupiah spasi biasa',
    input: 1500000,
    laravel: (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n),
    port: (n) => fmt.formatRupiah(n)
  },
  {
    id: 'T2',
    wrong: 'formatNumberID(x) untuk x.toLocaleString("id-ID") pada pecahan',
    why: 'formatNumberID membulatkan (maximumFractionDigits 0), toLocaleString menampilkan hingga 3 desimal',
    input: 1234.5,
    laravel: (n) => n.toLocaleString('id-ID'),
    port: (n) => fmt.formatNumberID(n)
  },
  {
    id: 'T3',
    wrong: 'formatDateID(now) untuk { day: "2-digit", month: "long", year: "numeric" }',
    why: 'formatDateID memakai hari numeric ("5"), Laravel "05"',
    input: '2026-10-05T01:00:00Z',
    laravel: (iso) => inZone(WIB, () => new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })),
    port: (iso) => fmt.formatDateID(iso)
  },
  {
    id: 'T4',
    wrong: 'formatDateIntl(new Date(y, m - 1, d), opsi) di browser WIT',
    why: 'tengah malam lokal WIT = 22.00 WIB hari sebelumnya; tanggal kalender harus lewat formatCalendarDateIntl',
    input: '2026-10-05',
    laravel: (key) => inZone('Asia/Jayapura', () => new Date(...keyParts(key).map((v, i) => (i === 1 ? v - 1 : v))).toLocaleDateString('id-ID', LONG)),
    port: (key) => inZone('Asia/Jayapura', () => fmt.formatDateIntl(new Date(...keyParts(key).map((v, i) => (i === 1 ? v - 1 : v))), LONG))
  },
  {
    id: 'T5',
    wrong: 'new Date().toISOString().slice(0, 10) sebagai kunci tanggal hari ini',
    why: 'memberi tanggal UTC — tertinggal sehari pada 00.00–06.59 WIB (17.00–23.59 UTC)',
    input: '2026-10-05T17:30:00Z',
    laravel: (iso) => fmt.toJakartaDateKey(iso),
    port: (iso) => new Date(iso).toISOString().slice(0, 10)
  }
]

// ===== Eksekusi =====

const show = (value) => JSON.stringify(value).replace(/ /g, '⍽') // NBSP ditandai supaya terlihat

const results = CASES.map((c) => {
  const failures = []
  const zoneDependentLaravel = []
  for (const input of c.inputs) {
    const wire = typeof input === 'object' && input !== null ? input : { label: input, laravel: input, port: input }
    const reference = inZone(WIB, () => c.run(wire.laravel))
    const references = Array.isArray(reference) ? reference : [reference]
    if (new Set(references).size !== 1) failures.push({ input: wire.label, zone: WIB, laravel: references, port: null, note: 'bentuk Laravel dalam kelompok ini tidak seragam' })

    // Klaim "Laravel tidak bergantung zona" untuk pola kalender: jalankan juga di zona lain.
    if (c.kind === 'calendar') {
      for (const zone of ZONES) {
        const other = inZone(zone, () => c.run(wire.laravel))
        if ([other].flat()[0] !== references[0]) zoneDependentLaravel.push({ input: wire.label, zone, laravel: other })
      }
    }

    const portZones = c.kind === 'number' ? [WIB] : ZONES
    for (const zone of portZones) {
      const port = inZone(zone, () => c.call(wire.port))
      if (port !== references[0]) failures.push({ input: wire.label, zone, laravel: references[0], port })
    }
  }
  return { ...c, exact: failures.length === 0 && zoneDependentLaravel.length === 0, failures, zoneDependentLaravel }
})

const traps = TRAPS.map((t) => {
  const laravel = t.laravel(t.input)
  const port = t.port(t.input)
  return { id: t.id, wrong: t.wrong, why: t.why, input: t.input, laravel, port, differs: laravel !== port }
})

// ===== Cakupan: setiap pemanggilan Intl/toLocale* Laravel harus terpetakan =====

let coverage = null
if (laravelJs) {
  const PATTERN = /toLocale(Date|Time|)String|Intl\.(NumberFormat|DateTimeFormat|RelativeTimeFormat|PluralRules)/
  const hits = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        fs.readFileSync(full, 'utf8')
          .split(/\r?\n/)
          .forEach((line, index) => {
            if (PATTERN.test(line)) hits.push(`${path.relative(laravelJs, full).split(path.sep).join('/')}:${index + 1}`)
          })
      }
    }
  }
  walk(laravelJs)
  const mapped = new Set([...CASES.flatMap((c) => c.sites), ...DEAD])
  const unmapped = hits.filter((site) => !mapped.has(site))
  const stale = [...mapped].filter((site) => !hits.includes(site))
  coverage = { calls: hits.length, mapped: hits.length - unmapped.length, unmapped, stale }
}

const report = {
  zones: ZONES,
  cases: results.map(({ run, call, inputs, ...rest }) => ({ ...rest, inputs: inputs.length })),
  dead: DEAD,
  traps,
  coverage
}
fs.writeFileSync(outPath, JSON.stringify(report, null, 1))

for (const r of results) {
  console.log(`\n■ ${r.id} ${r.exact ? 'SETARA' : 'TIDAK SETARA'} · ${r.sites.length + (r.extraSites?.length ?? 0)} pemanggilan · ${r.domain}`)
  console.log(`  Laravel: ${r.laravel}\n  Port   : ${r.port}`)
  for (const f of r.failures.slice(0, 4)) console.log(`    ${show(f.input)} @${f.zone}: laravel ${show(f.laravel)} · port ${show(f.port)}${f.note ? ` (${f.note})` : ''}`)
  for (const z of r.zoneDependentLaravel.slice(0, 4)) console.log(`    Laravel bergantung zona: ${show(z.input)} @${z.zone} -> ${show(z.laravel)}`)
}
console.log('\n■ Jebakan (harus BERBEDA)')
for (const t of traps) console.log(`  ${t.id} ${t.differs ? 'berbeda' : 'TERNYATA SAMA'} · ${t.wrong}: laravel ${show(t.laravel)} · port ${show(t.port)}`)
if (coverage) {
  console.log(`\n■ Cakupan: ${coverage.mapped}/${coverage.calls} pemanggilan Laravel terpetakan`)
  for (const site of coverage.unmapped) console.log(`  BELUM DIPETAKAN ${site}`)
  for (const site of coverage.stale) console.log(`  BASI (tidak ada lagi di Laravel) ${site}`)
}

const failed = results.filter((r) => !r.exact).length + (coverage ? coverage.unmapped.length + coverage.stale.length : 0)
console.log(`\n${failed ? `GAGAL: ${failed} masalah` : `BERSIH: ${results.length} kelompok setara di ${ZONES.length} zona`}`)
process.exit(failed ? 1 : 0)
