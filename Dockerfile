FROM node:24-bookworm-slim AS web-build
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci
COPY apps/web apps/web
RUN npm run build
RUN npm prune --omit=dev

FROM python:3.12-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends libstdc++6 ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=web-build /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY --from=web-build /app/node_modules node_modules
COPY --from=web-build /app/apps/web/build apps/web/build
COPY package.json ./
COPY backend backend
COPY scripts/start.py scripts/start.py
RUN useradd --create-home appuser
USER appuser
ENV NODE_ENV=production PORT=8080 AI_MODE=demo
EXPOSE 8080
CMD ["python", "scripts/start.py"]
