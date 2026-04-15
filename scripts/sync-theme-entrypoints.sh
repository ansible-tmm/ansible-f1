#!/usr/bin/env bash
# Copy root index.html into each theme URL path so GitHub Pages serves real files
# (e.g. /ansible-f1/AIOps/index.html). Keep SLUGS in sync with pathSegment in
# src/data/config.js and the inline SLUGS list in index.html.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

THEMES=(
  AIOps
  Workflows
  Developer-Experience
  Policy-and-governance
  Infrastructure-and-network
  AAP-on-cloud
  Metrics-and-telemetry
  AAP-101
)

for d in "${THEMES[@]}"; do
  mkdir -p "$d"
  cp -f index.html "$d/index.html"
done

cp -f index.html 404.html
