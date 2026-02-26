FROM node:22-alpine

RUN corepack enable

WORKDIR /app

COPY . ./

RUN pnpm i

EXPOSE 1996

CMD [ "pnpm", "start" ]