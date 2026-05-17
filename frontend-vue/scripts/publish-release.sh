#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 3 ]; then
  echo "Usage: $0 <tag> <title> <notes-file-or-text>"
  echo "Requires: gh CLI logged in (https://cli.github.com)"
  exit 2
fi

TAG="$1"
TITLE="$2"
NOTES="$3"
REPO="richaaron/folushovictory"
ASSET="frontend-vue/android/app/build/outputs/apk/release/app-release-signed.apk"

if [ ! -f "$ASSET" ]; then
  echo "APK asset not found at $ASSET"
  exit 1
fi

echo "Creating release $TAG on $REPO and uploading $ASSET"
gh release create "$TAG" "$ASSET" --title "$TITLE" --notes-file "$NOTES" --repo "$REPO"
echo "Release created."
