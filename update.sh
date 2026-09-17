#!/usr/bin/env bash
# Pull the latest code and rebuild the container. Run from /opt/site.
set -euo pipefail
cd "$(dirname "$0")"
[ -d .git ] && [ -z "${SITE_NO_PULL:-}" ] && git pull --ff-only || true

# Keep the reverse-proxy settings in step with the repository.
SRC="deploy/docker-compose.override.traefik.yml"
if [ -z "${SITE_NO_OVERRIDE_SYNC:-}" ] && [ -f "$SRC" ]; then
  if ! cmp -s "$SRC" docker-compose.override.yml 2>/dev/null; then
    cp -f "$SRC" docker-compose.override.yml
    echo "• reverse-proxy settings updated from $SRC"
  fi
fi

docker compose up -d --build --remove-orphans

sleep 2
curl -fsS "http://127.0.0.1:8089/healthz" >/dev/null \
  && echo "✓ site updated and healthy" \
  || { docker compose logs --tail=40 site; exit 1; }
