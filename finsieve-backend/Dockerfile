# Finsieve backend - Railway / Docker deploy
FROM node:20-alpine

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
