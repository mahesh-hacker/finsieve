# Finsieve backend - Railway / Docker deploy (Node 22 required by yahoo-finance2)
FROM node:22-alpine

WORKDIR /app

# Copy package file first for better layer cache
COPY package.json ./

# Install dependencies (no package-lock in repo)
RUN npm install --omit=dev

# Copy application
COPY . .

# Server listens on PORT (Railway sets this)
EXPOSE 3000

CMD ["node", "src/server.js"]
