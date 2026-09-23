FROM node:24.21.0-bookworm-slim

WORKDIR /workspace

RUN groupadd --gid 1001 nodejs \
  && useradd --uid 1001 --gid nodejs --create-home --shell /bin/bash nextjs

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint
RUN chmod 755 /usr/local/bin/docker-entrypoint

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint"]
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
