#!/usr/bin/env bash

set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo 'Docker with Compose is required for the infrastructure smoke test.' >&2
  exit 1
fi

docker compose config -q
docker compose build app
docker compose run --rm --no-deps app npm ci --ignore-scripts
docker compose run --rm --no-deps app npm run format:check
docker compose run --rm --no-deps app npm run lint
docker compose run --rm --no-deps app npm run typecheck
docker compose run --rm --no-deps app npm run test
docker compose down --volumes --remove-orphans
