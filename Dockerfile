FROM node:24.21.0-bookworm-slim

WORKDIR /workspace

RUN groupadd --gid 1001 nodejs \
  && useradd --uid 1001 --gid nodejs --create-home --shell /bin/bash nextjs

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

USER nextjs

EXPOSE 3000

# The application entrypoint is intentionally supplied by the future app bootstrap.
CMD ["sleep", "infinity"]
