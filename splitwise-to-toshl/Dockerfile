FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
COPY . .

RUN yarn install --production && yarn cache clean

EXPOSE 5544
CMD ["node", "server.js"]
