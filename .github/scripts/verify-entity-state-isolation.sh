#!/usr/bin/env bash
# Architecture fitness checks (modular-architecture / verification.md — State isolation)
# 1) Duplicate TypeORM logical table names from @Entity (name: '...') or @Entity('...')
# 2) Cross-module imports of entities via @tlc/* paths (excluding *shared*)
#
# Usage: from repo root — .github/scripts/verify-entity-state-isolation.sh
# Env:   MODULAR_PACKAGE_ROOT — default "package" (use "packages" if your tree differs)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PKG_ROOT_NAME="${MODULAR_PACKAGE_ROOT:-package}"
SCAN="${ROOT}/${PKG_ROOT_NAME}"

if [[ ! -d "$SCAN" ]]; then
  echo "❌ verify-entity-state-isolation: directory not found: $SCAN" >&2
  echo "   Set MODULAR_PACKAGE_ROOT if your modules live elsewhere." >&2
  exit 1
fi

FAILED=0

echo "🔍 Entity state isolation (scan: ${PKG_ROOT_NAME}/)"
echo ""

# --- Check 1: duplicate @Entity table names ---
set +e
DUPLICATE_REPORT="$(python3 - "$SCAN" <<'PY'
import re
import sys
from collections import defaultdict
from pathlib import Path

scan = Path(sys.argv[1])

def extract_table_name(line: str):
    m = re.search(
        r"@Entity\s*\(\s*(?:\{([^}]*)\}|'([^']+)'|\"([^\"]+)\")",
        line,
    )
    if not m:
        return None
    if m.group(1) is not None:
        inner = m.group(1)
        mname = re.search(r"name\s*:\s*['\"]([^'\"]+)['\"]", inner)
        return mname.group(1) if mname else None
    return m.group(2) or m.group(3)

by_name = defaultdict(list)
for path in sorted(scan.rglob("*.ts")):
    if "node_modules" in path.parts:
        continue
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        continue
    for line in text.splitlines():
        name = extract_table_name(line)
        if name:
            try:
                rel = path.relative_to(scan.parent)
            except ValueError:
                rel = path
            by_name[name].append(str(rel))

duplicates = {k: v for k, v in by_name.items() if len(v) > 1}
if duplicates:
    lines = ["❌ Duplicate @Entity table names (same logical name in more than one file):"]
    for name in sorted(duplicates):
        lines.append(f"  • {name!r}")
        for p in sorted(set(duplicates[name])):
            lines.append(f"      - {p}")
    print("\n".join(lines))
    sys.exit(1)
sys.exit(0)
PY
)"
DUPLICATE_EXIT=$?
set -e

if [[ "$DUPLICATE_EXIT" -ne 0 ]]; then
  echo "$DUPLICATE_REPORT"
  FAILED=1
else
  echo "✅ No duplicate @Entity table names across ${PKG_ROOT_NAME}/"
fi

echo ""

# --- Check 2: cross-module entity imports (@tlc paths) ---
# Mirrors: grep -r "from.*@tlc.*/.*entity" … | grep -v shared
CROSS_IMPORTS=""
if command -v rg >/dev/null 2>&1; then
  CROSS_IMPORTS="$(rg -N --no-heading "from ['\"]@tlc/[^'\"]*entity" "$SCAN" --glob "*.ts" 2>/dev/null | grep -v shared || true)"
else
  CROSS_IMPORTS="$(grep -R -n --include="*.ts" -E "from ['\"]@tlc/[^'\"]*entity" "$SCAN" 2>/dev/null | grep -v shared || true)"
fi

if [[ -n "$CROSS_IMPORTS" ]]; then
  echo "❌ Cross-module @tlc entity imports (or disallowed paths) found:"
  echo "$CROSS_IMPORTS"
  FAILED=1
else
  echo "✅ No forbidden cross-module @tlc entity imports under ${PKG_ROOT_NAME}/"
fi

echo ""

if [[ "$FAILED" -ne 0 ]]; then
  echo "State isolation checks failed. See modular-architecture references/verification.md (State isolation)."
  exit 1
fi

echo "All entity state isolation checks passed."
exit 0
