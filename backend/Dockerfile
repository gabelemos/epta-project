FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev && npm install prisma@^6.1.0
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=build /app/dist ./dist
EXPOSE 3333
# `db push` sincroniza o schema com o Postgres na subida (sem migrations versionadas — ver README)
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]
