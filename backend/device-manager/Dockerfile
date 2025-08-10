# node-app Dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./
COPY . .

RUN npm install
EXPOSE 5057
CMD ["node", "server.js"]
