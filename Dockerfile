FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm ci

COPY . .

RUN npm run build

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
