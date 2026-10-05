#!/usr/bin/env bash
# ============================================================================
# Membuat direktori kerja harness ($WORK) dari nol. Repo Laravel TIDAK disentuh — hanya dibaca.
# ============================================================================
# Pemakaian:
#   WORK=<dir kosong> LARAVEL=<repo UBSC-LARAVEL> bash bootstrap.sh
#
# Hasil:
#   $WORK/laravel-built.min.css   oracle: CSS produksi Laravel (public/build/assets/app-*.css)
#   $WORK/laravel-built.css       salinan oracle untuk extract.mjs
#   $WORK/upgrade                 repo git: tag baseline-v3 (salinan Laravel) -> tag codemod (upgrade 4.3.3 + perbaikan)
#   $WORK/cm                      repo git baseline v3 untuk codemod Styleguide.tsx (pipeline.sh langkah 3)
#   $WORK/v3ref                   tailwindcss@3.4.19 + variabel prose bernilai v3
#
# Setelahnya: WORK=... LARAVEL=... bash pipeline.sh <nama> <lebar,...> --apply-corrections
set -euo pipefail

: "${WORK:?set WORK ke direktori kerja baru}"
: "${LARAVEL:?set LARAVEL ke repo UBSC-LARAVEL}"
H="$(cd "$(dirname "$0")" && pwd)"
GIT_ID=(-c user.name=harness -c user.email=harness@local)
mkdir -p "$WORK"

echo "[1/5] oracle CSS produksi Laravel"
shopt -s nullglob
oracles=("$LARAVEL"/public/build/assets/app-*.css)
if [ "${#oracles[@]}" -ne 1 ]; then
  echo "harus tepat satu public/build/assets/app-*.css, ditemukan ${#oracles[@]} — jalankan npm run build di Laravel dulu" >&2
  exit 1
fi
cp "${oracles[0]}" "$WORK/laravel-built.min.css"
cp "${oracles[0]}" "$WORK/laravel-built.css"

echo "[2/5] baseline v3: salinan sumber frontend Laravel"
BASE="$WORK/base"
rm -rf "$BASE" && mkdir -p "$BASE"
cp -r "$LARAVEL/resources" "$BASE/resources"
rm -rf "$BASE/resources/views"
cp "$LARAVEL/tailwind.config.js" "$LARAVEL/tsconfig.json" "$BASE/"
# package.json minimal berversi pasti: codemod hanya butuh Tailwind v3 + plugin yang dipakai config Laravel.
cat > "$BASE/package.json" <<'PKG'
{
  "name": "ubsc-tailwind-upgrade-scratch",
  "private": true,
  "type": "module",
  "devDependencies": {
    "tailwindcss": "3.4.19",
    "@tailwindcss/forms": "0.5.11",
    "@tailwindcss/typography": "0.5.20",
    "tailwindcss-animate": "1.0.7",
    "postcss": "8.5.16",
    "autoprefixer": "10.5.2"
  }
}
PKG
cat > "$BASE/postcss.config.js" <<'POSTCSS'
export default {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
    },
};
POSTCSS
echo "node_modules/" > "$BASE/.gitignore"
(cd "$BASE" && npm install --no-audit --no-fund > /dev/null && git init -q && git "${GIT_ID[@]}" add -A && git "${GIT_ID[@]}" commit -qm "baseline v3 (salinan Laravel)" && git tag baseline-v3)

echo "[3/5] upgrade: codemod @tailwindcss/upgrade@4.3.3 + perbaikan flex-shrink"
rm -rf "$WORK/upgrade" "$WORK/cm"
git clone -q "$BASE" "$WORK/upgrade"
(
  cd "$WORK/upgrade"
  git fetch -q --tags
  npm ci --no-audit --no-fund > /dev/null
  npx --yes @tailwindcss/upgrade@4.3.3 --force > "$WORK/upgrade.log" 2>&1
  # Bug codemod (docs/fase-2.md temuan 1): properti CSS `flex-shrink:` di dalam string <style> runtime ditulis
  # ulang menjadi `shrink:` (tidak valid). Kembalikan — `shrink:` berdiri sendiri tidak pernah sah di CSS maupun
  # sebagai varian Tailwind.
  grep -rlP '(?<![-\w])shrink:\s' resources/js | while read -r f; do
    perl -0pi -e 's/(?<![-\w])shrink:(\s)/flex-shrink:$1/g' "$f"
  done
  git "${GIT_ID[@]}" add -A && git "${GIT_ID[@]}" commit -qm "codemod @tailwindcss/upgrade 4.3.3 + perbaikan flex-shrink" && git tag codemod
)

echo "[4/5] cm: worktree baseline v3 untuk codemod Styleguide.tsx"
git clone -q "$BASE" "$WORK/cm"
(cd "$WORK/cm" && npm ci --no-audit --no-fund > /dev/null)

echo "[5/5] v3ref: nilai rujukan Tailwind v3"
mkdir -p "$WORK/v3ref"
(cd "$WORK/v3ref" && echo '{"name":"v3ref","private":true,"dependencies":{"tailwindcss":"3.4.19"}}' > package.json && npm install --no-audit --no-fund > /dev/null)
# styles.js milik plugin typography (versi yang dipakai kandidat v4), di-require dari v3ref supaya
# require('tailwindcss/colors') di dalamnya me-resolve palet v3 (hex).
cp "$H/node_modules/@tailwindcss/typography/src/styles.js" "$WORK/v3ref/typography-styles.cjs"
cp "$H/reference/gen-prose.cjs" "$WORK/v3ref/gen-prose.cjs"
(cd "$WORK/v3ref" && node gen-prose.cjs > /dev/null)

echo "selesai: $WORK"
