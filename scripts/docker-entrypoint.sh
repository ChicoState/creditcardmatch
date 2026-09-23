#!/usr/bin/env sh

set -eu

for directory in /workspace/node_modules /workspace/.next; do
  if [ -d "$directory" ]; then
    chown nextjs:nodejs "$directory"
  fi
done

exec runuser -u nextjs -- "$@"
