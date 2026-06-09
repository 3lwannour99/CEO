FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG DATABASE_PROVIDER=postgresql
ARG DATABASE_URL

RUN DATABASE_PROVIDER="$DATABASE_PROVIDER" DATABASE_URL="$DATABASE_URL" npm run build

CMD ["npm","run","start:prod:with-db"]
