#!/usr/bin/env bash
# Usage: ./resolve-app-deps.sh <app-name>
# Output: space-separated list of source root paths for the app and all its dependencies
# Example: ./resolve-app-deps.sh monolith
#   -> app/monolith package/content package/identity package/shared/module

set -euo pipefail

APP="${1:?Usage: $0 <app-name>}"

# Include the app's own root plus all transitive dependency roots
npx nx graph --json 2>/dev/null | jq -r --arg app "$APP" '
  # Collect all transitive deps recursively
  def transitive($node):
    (.graph.dependencies[$node] // [])[] |
    .target as $dep |
    $dep,
    transitive($dep)
  ;

  # Get source root for a project node
  def root($node):
    .graph.nodes[$node].data.root // empty
  ;

  # App itself + all transitive deps
  (root($app)),
  ([transitive($app)] | unique[]) as $dep |
  root($dep)
' | sort -u | tr '\n' ' ' | xargs
