FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-slim

LABEL org.opencontainers.image.source="https://github.com/wirux/mcp-wealthfolio"
LABEL org.opencontainers.image.description="Read-only MCP server for Wealthfolio portfolio tracker"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

RUN groupadd -r mcp && useradd -r -g mcp mcp

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER mcp

ENTRYPOINT ["node", "dist/index.js"]
