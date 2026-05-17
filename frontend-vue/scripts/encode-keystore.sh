#!/usr/bin/env bash
set -euo pipefail

KEYSTORE="android/app/build-keystore.jks"
OUT="keystore.b64"

if [ ! -f "$KEYSTORE" ]; then
  echo "Keystore not found at $KEYSTORE"
  exit 1
fi

base64 -w0 "$KEYSTORE" > "$OUT"
echo "Wrote base64 keystore to $OUT"
