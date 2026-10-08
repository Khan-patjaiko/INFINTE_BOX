#!/usr/bin/env bash
# Tell Bing (and Yahoo, DuckDuckGo, Ecosia, Yandex…) that pages changed, via IndexNow.
#
#   scripts/indexnow.sh           submit every URL in site/sitemap.xml
#   scripts/indexnow.sh URL...    submit specific URLs
#
# IndexNow proves we own the site by fetching site/indexnow-key.txt from the live domain,
# so that file must stay in public_html forever. This script checks it first.
# Google does not use IndexNow: use Search Console → URL Inspection → Request indexing.
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="infinite-box.co"
KEY=$(tr -d ' \r\n' < site/indexnow-key.txt)
KEY_URL="https://$HOST/indexnow-key.txt"

LIVE=$(curl -fsS "$KEY_URL" | tr -d ' \r\n') || LIVE=""
if [ "$LIVE" != "$KEY" ]; then
  echo "STOP: $KEY_URL is missing or wrong on the live site. Re-upload site/indexnow-key.txt to public_html." >&2
  exit 1
fi

if [ $# -gt 0 ]; then
  URLS=("$@")
else
  mapfile -t URLS < <(grep -o '<loc>[^<]*</loc>' site/sitemap.xml | sed -E 's#</?loc>##g')
fi

LIST=$(printf '"%s",' "${URLS[@]}")
BODY="{\"host\":\"$HOST\",\"key\":\"$KEY\",\"keyLocation\":\"$KEY_URL\",\"urlList\":[${LIST%,}]}"

CODE=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" --data "$BODY")
echo "IndexNow: HTTP $CODE for ${#URLS[@]} URLs (200/202 = accepted)"
[ "$CODE" = 200 ] || [ "$CODE" = 202 ]
