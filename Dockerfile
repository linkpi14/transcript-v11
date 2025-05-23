FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache ffmpeg python3 py3-pip make g++ wget

# Instalar yt-dlp
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build do Vite (supondo que o frontend esteja em ./client)
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
