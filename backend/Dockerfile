FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG DATABASE_PROVIDER=postgresql
ARG DATABASE_URL

RUN if [ "$DATABASE_PROVIDER" = "mysql" ]; then \
        PRISMA_GENERATE_DATABASE_URL="${DATABASE_URL:-mysql://user:password@localhost:3306/db}"; \
    elif [ -z "$DATABASE_PROVIDER" ] || [ "$DATABASE_PROVIDER" = "postgres" ] || [ "$DATABASE_PROVIDER" = "postgresql" ]; then \
        DATABASE_PROVIDER=postgresql; \
        PRISMA_GENERATE_DATABASE_URL="${DATABASE_URL:-postgresql://user:password@localhost:5432/db?schema=public}"; \
    else \
        echo "Unsupported DATABASE_PROVIDER \"$DATABASE_PROVIDER\". Use postgresql or mysql."; \
        exit 1; \
    fi; \
    DATABASE_PROVIDER="$DATABASE_PROVIDER" \
    DATABASE_URL="$PRISMA_GENERATE_DATABASE_URL" \
    node scripts/prisma-provider.mjs generate "$DATABASE_PROVIDER"

RUN npm run build

CMD ["npm","run","start:prod"]
