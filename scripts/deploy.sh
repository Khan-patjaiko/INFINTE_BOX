#!/usr/bin/env bash
# Upload site/ changes to Hostinger (public_html) over encrypted FTP.
#
#   scripts/deploy.sh --dry-run   show what would be uploaded
#   scripts/deploy.sh             upload site/ files changed since the last deploy
#   scripts/deploy.sh FILE...     upload specific files (paths relative to site/)
#
# Credentials live OUTSIDE the repo in a netrc file (default ~/.infinitebox-ftp), one line:
#   machine ftp.hstgr.io login <FTP username> password <FTP password>
# The FTP certificate is *.hstgr.io, so we connect to the server IP under that name.
# The git tag "deployed" marks the last commit whose site/ is live.
set -euo pipefail
cd "$(dirname "$0")/.."

NETRC="${IB_FTP_NETRC:-$HOME/.infinitebox-ftp}"
SERVER_IP="145.79.26.182"
FTP_NAME="ftp.hstgr.io"
REMOTE_DIR="${IB_FTP_DIR:-public_html}"

ftp() { curl -sS --ssl-reqd --netrc-file "$NETRC" --connect-to "$FTP_NAME:21:$SERVER_IP:21" "$@"; }

DRY=0
if [ "${1:-}" = "--dry-run" ]; then DRY=1; shift; fi

AUTO=0
if [ $# -gt 0 ]; then
  FILES=("$@")
else
  AUTO=1
  BASE=$(git rev-parse -q --verify "deployed^{commit}") || { echo "No 'deployed' tag: pass files explicitly."; exit 1; }
  if [ -n "$(git status --porcelain -- site/)" ]; then
    echo "site/ has uncommitted changes; commit them first:"; git status --short -- site/; exit 1
  fi
  mapfile -t FILES < <(git diff --name-only --diff-filter=ACMR "$BASE" HEAD -- site/ | sed 's#^site/##')
  mapfile -t GONE < <(git diff --name-only --diff-filter=D "$BASE" HEAD -- site/ | sed 's#^site/##')
  for f in "${GONE[@]}"; do echo "NOTE: deleted locally, still on the server: $f (remove it in File Manager)"; done
fi

if [ ${#FILES[@]} -eq 0 ]; then echo "Nothing to upload."; exit 0; fi
if [ $DRY -eq 0 ] && [ ! -f "$NETRC" ]; then echo "Missing credentials file: $NETRC"; exit 1; fi

for f in "${FILES[@]}"; do
  [ -f "site/$f" ] || { echo "Not a file: site/$f"; exit 1; }
  if [ $DRY -eq 1 ]; then echo "would upload: $f"; continue; fi
  ftp --ftp-create-dirs -T "site/$f" "ftp://$FTP_NAME/$REMOTE_DIR/${f// /%20}"
  echo "uploaded: $f"
done

if [ $DRY -eq 0 ] && [ $AUTO -eq 1 ]; then
  git tag -f deployed HEAD >/dev/null
  echo "Tag 'deployed' -> $(git rev-parse --short HEAD)"
fi
