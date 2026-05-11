#!/usr/bin/env bash
set -Eeuo pipefail
url="${1:?usage: wait-for-http.sh URL}"
for _ in $(seq 1 60); do
  if curl -fsS "$url" >/dev/null; then
    exit 0
  fi
  sleep 1
done
echo "Timed out waiting for $url" >&2
exit 1
