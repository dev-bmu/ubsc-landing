#!/usr/bin/env bash
# ============================================================================
# Pipeline gate Fase 2 — dari inventaris sampai laporan.
# ============================================================================
# Pemakaian:
#   WORK=<dir kerja> LARAVEL=<repo Laravel> bash pipeline.sh <nama-kandidat> <lebar,lebar,...> [opsi]
#
# Opsi:
#   --skip-codemod        pakai $WORK/gen/Styleguide.v4.tsx yang sudah ada (codemod ± 3 menit)
#   --apply-corrections   jalankan corrections.mjs --apply ke sumber migrasi ($WORK/upgrade), lalu bangun
#                         ulang korpus, halaman, dan kandidat dari string hasil koreksi
#   --pages=0,3,7         walker hanya halaman tertentu (iterasi cepat)
#   --page-size=300       sel per halaman (halaman sempit setinggi puluhan ribu piksel memperlambat screenshot)
#   --no-walk             berhenti setelah kandidat terkompilasi
#
# $WORK dibuat oleh bootstrap.sh. Keluaran data ada di $WORK; CSS kandidat di candidates/ harness
# (di-.gitignore) karena Tailwind CLI me-resolve @import 'tailwindcss' relatif terhadap berkas masukan.
set -euo pipefail

NAME="$1"
WIDTHS="$2"
shift 2
SKIP_CODEMOD=""
APPLY=""
PAGES=""
PAGE_SIZE=300
WALK=1
for arg in "$@"; do
  case "$arg" in
    --skip-codemod) SKIP_CODEMOD=1 ;;
    --apply-corrections) APPLY=1 ;;
    --pages=*) PAGES="$arg" ;;
    --page-size=*) PAGE_SIZE="${arg#--page-size=}" ;;
    --no-walk) WALK="" ;;
    *) echo "opsi tidak dikenal: $arg" >&2; exit 2 ;;
  esac
done

: "${WORK:?set WORK ke direktori kerja harness (lihat bootstrap.sh)}"
: "${LARAVEL:?set LARAVEL ke repo UBSC-LARAVEL}"
H="$(cd "$(dirname "$0")" && pwd)"
GEN="$WORK/gen"
CAND="$H/candidates"
PORT="${PORT:-4599}"
mkdir -p "$GEN" "$CAND"

prepare_cells() {
  node "$H/corpus.mjs" "$WORK/inventory.json" "$LARAVEL/resources/js" "$WORK/upgrade/resources/js" "$WORK/corpus.json"
  node "$H/gen-cells.mjs" "$WORK/inventory.json" "$GEN" "$WORK/corpus.json"
}

compile_candidate() {
  node "$H/build-pages.mjs" "$GEN" "--page-size=$PAGE_SIZE"
  node "$H/assemble.mjs" "$WORK/upgrade/resources/css/app.css" "$WORK/v3ref" "$CAND/$NAME.mono.css" --bespoke-layer=utilities "--harness-source=$GEN/out/candidate-source.txt" "--emit-dir=$CAND/$NAME.emit"

  # Yang DIUKUR harness adalah entry dari berkas final terpecah — persis berkas yang disalin ke src/styles repo
  # Next. Kandidat monolitik hanya pembanding: @utility di dalam berkas hasil @import membuat Tailwind tidak
  # menulis variabel tema milik utilitas yang tidak terpakai, jadi keduanya boleh berbeda di :root saja.
  cat > "$CAND/$NAME.css" <<SPLIT
@import 'tailwindcss' source(none);
@source '$GEN/out/candidate-source.txt';
@import './$NAME.emit/tailwind-v3-compat.css';
@import './$NAME.emit/ubsc-base.css';
@import './$NAME.emit/ubsc-bespoke.css' layer(utilities);
@import './$NAME.emit/tailwind-v3-utilities.css';
SPLIT
  (cd "$H" && npx @tailwindcss/cli -i "$CAND/$NAME.css" -o "$CAND/$NAME.out.css" 2>&1 | grep -iE "error|warn" || true)
  test -s "$CAND/$NAME.out.css" || { echo "kompilasi kandidat gagal" >&2; exit 1; }

  (cd "$H" && npx @tailwindcss/cli -i "$CAND/$NAME.mono.css" -o "$CAND/$NAME.mono.out.css" 2>&1 | grep -iE "error|warn" || true)
  if cmp -s "$CAND/$NAME.out.css" "$CAND/$NAME.mono.out.css"; then
    echo "  kandidat terpecah == monolitik (byte identik)"
  elif diff "$CAND/$NAME.mono.out.css" "$CAND/$NAME.out.css" | grep '^[<>]' | grep -vqE '^[<>] +--[a-z0-9-]+: [^;]+;$'; then
    echo "  ! kandidat terpecah berbeda dari monolitik DI LUAR variabel tema:" >&2
    diff "$CAND/$NAME.mono.out.css" "$CAND/$NAME.out.css" | head -40 >&2
    exit 1
  else
    echo "  kandidat terpecah == monolitik, kecuali $(diff "$CAND/$NAME.mono.out.css" "$CAND/$NAME.out.css" | grep -c '^[<>]') baris variabel tema tak terpakai di :root"
  fi
}

if [ -n "$APPLY" ]; then
  # Koreksi selalu dihitung dari output codemod ASLI (tag `codemod` di $WORK/upgrade), bukan dari hasil koreksi
  # sebelumnya: string yang panjang tokennya sudah diubah R1/R2 dilewati mesin koreksi, jadi penerapan berlapis
  # diam-diam melewatkan koreksi baru.
  echo "[0/6] kembalikan sumber migrasi ke output codemod"
  git -C "$WORK/upgrade" checkout -q codemod -- resources/js
fi

echo "[1/6] inventaris oracle"
node "$H/extract.mjs" "$WORK/laravel-built.css" "$LARAVEL/resources/css/app.css" "$WORK/inventory.json" > /dev/null

echo "[2/6] korpus + sel"
prepare_cells

if [ -z "$SKIP_CODEMOD" ]; then
  echo "[3/6] codemod pada Styleguide.tsx (worktree baseline v3)"
  (
    cd "$WORK/cm"
    git reset -q --hard "$(git rev-list --max-parents=0 HEAD)"
    # Codemod memasang tailwindcss v4 ke node_modules; tanpa pasang ulang v3, run berikutnya gagal membaca
    # tailwind.config.js dan tidak memigrasi apa pun.
    rm -rf node_modules && npm ci --no-audit --no-fund > /dev/null 2>&1
    cp "$GEN/Styleguide.tsx" resources/js/Styleguide.tsx
    git -c user.name=h -c user.email=h@l add -A && git -c user.name=h -c user.email=h@l commit -q -m styleguide
    npx --yes @tailwindcss/upgrade@4.3.3 --force > "$WORK/cm-upgrade.log" 2>&1
    cp resources/js/Styleguide.tsx "$GEN/Styleguide.v4.tsx"
  )
else
  echo "[3/6] codemod dilewati (memakai Styleguide.v4.tsx yang ada)"
fi

echo "[4/6] halaman + kandidat $NAME"
compile_candidate

if [ -n "$APPLY" ]; then
  echo "[5/6] koreksi markup R0-R3 -> sumber migrasi, lalu bangun ulang"
  node "$H/corrections.mjs" "$WORK/upgrade/resources/js" "$LARAVEL/resources/js" "$WORK/laravel-built.min.css" "$CAND/$NAME.out.css" \
    "$GEN/out/class-map.json" "$WORK/inventory.json" "$WORK/v3ref" "$WORK/corrections-applied.json" --apply
  git -C "$WORK/upgrade" -c user.name=h -c user.email=h@l commit -q --allow-empty -am "koreksi markup R0-R4 (pipeline.sh --apply-corrections)"
  prepare_cells
  compile_candidate
else
  echo "[5/6] koreksi dilewati"
fi

if [ -z "$WALK" ]; then
  echo "[6/6] walker dilewati (--no-walk)"
  exit 0
fi

echo "[6/6] walker $WIDTHS"
node "$H/server.mjs" "$GEN/out" "$WORK/laravel-built.min.css" "$LARAVEL/public" "$CAND/$NAME.out.css" "$PORT" > "$WORK/server.log" 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
for _ in $(seq 1 30); do curl -sf "http://127.0.0.1:$PORT/pages.json" > /dev/null && break; sleep 0.5; done
node "$H/walk.mjs" "http://127.0.0.1:$PORT" "$WORK/run-$NAME" "$WIDTHS" $PAGES "--expect-candidate=$CAND/$NAME.out.css"
