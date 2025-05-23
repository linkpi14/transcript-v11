FROM node:18-alpine

# Instala dependências do sistema
RUN apk add --no-cache ffmpeg python3 py3-pip make g++

# Instala yt-dlp via pip
RUN pip install -U yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 3001

CMD ["npm", "start"]
