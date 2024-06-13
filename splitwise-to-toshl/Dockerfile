FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
COPY . .
RUN yarn install

EXPOSE 2567
CMD ["yarn", "dev:all"]
