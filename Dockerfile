FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm ci

COPY . .

RUN npm run build

CMD ["node", "dist/index.js"]
