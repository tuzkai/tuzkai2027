#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_root"

fail() {
  echo "Render build error: $*" >&2
  exit 1
}

require_file() {
  [ -s "$1" ] || fail "Missing required file: $1 (run this script from the complete workspace repository)"
}

require_file pnpm-workspace.yaml
grep -Fq '  - artifacts/*' pnpm-workspace.yaml ||
  fail "pnpm-workspace.yaml must include the artifacts/* workspace"

require_file artifacts/api-server/package.json
require_file artifacts/sztuzk-jewelry-studio/package.json
require_file artifacts/tuzakai-jewelry-designer/package.json
require_file scripts/package.json
require_file lib/api-client-react/package.json
require_file lib/api-spec/package.json
require_file lib/api-zod/package.json
require_file lib/db/package.json
require_file lib/integrations-openai-ai-server/package.json

pnpm run typecheck

BASE_PATH=/ pnpm --filter @workspace/sztuzk-jewelry-studio run build
require_file artifacts/sztuzk-jewelry-studio/dist/public/index.html

PORT=23466 BASE_PATH=/tuzakai/ pnpm --filter @workspace/tuzakai-jewelry-designer run build
require_file artifacts/tuzakai-jewelry-designer/dist/public/index.html

pnpm --filter @workspace/api-server run build
require_file artifacts/api-server/dist/index.mjs

web_root=artifacts/api-server/dist/public
mkdir -p "$web_root/tuzakai"
cp -a artifacts/sztuzk-jewelry-studio/dist/public/. "$web_root/"
cp -a artifacts/tuzakai-jewelry-designer/dist/public/. "$web_root/tuzakai/"

test -s "$web_root/index.html"
test -s "$web_root/tuzakai/index.html"