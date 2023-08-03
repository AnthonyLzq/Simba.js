FROM node:18-alpine

RUN corepack enable

WORKDIR /app

COPY . ./

RUN pnpm i

CMD [ "pnpm", "start" ]