#!/bin/sh
set -eu

pnpm run typecheck

BASE_PATH=/ pnpm --filter @workspace/sztuzk-jewelry-studio run build
PORT=23466 BASE_PATH=/tuzakai/ pnpm --filter @workspace/tuzakai-jewelry-designer run build
pnpm --filter @workspace/api-server run build

web_root=artifacts/api-server/dist/public
mkdir -p "$web_root/tuzakai"
cp -a artifacts/sztuzk-jewelry-studio/dist/public/. "$web_root/"
cp -a artifacts/tuzakai-jewelry-designer/dist/public/. "$web_root/tuzakai/"

test -s "$web_root/index.html"
test -s "$web_root/tuzakai/index.html"