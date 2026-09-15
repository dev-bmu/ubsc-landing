#!/usr/bin/env bash
# Pipeline gate Fase 2, dari inventaris sampai laporan.
# Pemakaian: bash pipeline.sh <nama-kandidat> <lebar,lebar,...> [--skip-codemod]
set -euo pipefail

NAME="$1"
WIDTHS="$2"
SKIP_CODEMOD="${3:-}"
SP="C:/Windows/TEMP/claude/C--IT-BMU-BMU-LANDINGPAGE/6b09edc7-8446-4a4c-9580-704ebbfc2fe0/scratchpad"
H="$SP/fase2/harness"
L="C:/IT BMU/BMU-LANDINGPAGE/UBSC-LARAVEL"
cd "$H"

echo "[1/5] inventaris + sel"
node extract.mjs "$SP/fase2/laravel-built.css" "$L/resources/css/app.css" "$SP/fase2/inventory.json" > /dev/null
node gen-cells.mjs "$SP/fase2/inventory.json" "$H" "$L/resources/js"

if [ "$SKIP_CODEMOD" != "--skip-codemod" ]; then
  echo "[2/5] codemod pada Styleguide.tsx (worktree baseline v3)"
  cd "$SP/fase2/cm"
  git reset -q --hard 303a628
  rm -rf node_modules && npm install --no-audit --no-fund > /dev/null 2>&1
  cp "$H/Styleguide.tsx" resources/js/Styleguide.tsx
  git -c user.name=s -c user.email=s@l add -A && git -c user.name=s -c user.email=s@l commit -q -m sg
  npx --yes @tailwindcss/upgrade@4.3.3 --force > "$SP/fase2/cm-upgrade.log" 2>&1
  cp resources/js/Styleguide.tsx "$H/Styleguide.v4.tsx"
  cd "$H"
else
  echo "[2/5] codemod dilewati (memakai Styleguide.v4.tsx yang ada)"
fi

echo "[3/5] halaman"
node build-pages.mjs "$H"

echo "[4/5] rakit + kompilasi kandidat $NAME"
node assemble.mjs "$SP/fase2/upgrade/resources/css/app.css" "$SP/fase2/v3ref" "candidates/$NAME.css" --bespoke-layer=utilities --harness-source=../out/candidate-source.html
npx @tailwindcss/cli -i "candidates/$NAME.css" -o "candidates/$NAME.out.css" 2>&1 | grep -iE "error|warn" || true
cp "candidates/$NAME.out.css" candidates/current.out.css

echo "[5/5] walker $WIDTHS"
node walk.mjs http://127.0.0.1:4599 "$SP/fase2/run-$NAME" "$WIDTHS"
