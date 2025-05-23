FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache ffmpeg python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 3001

CMD ["npm", "start"]