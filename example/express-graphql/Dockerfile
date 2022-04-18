FROM node:16-alpine

WORKDIR /app

COPY package.json ./

RUN yarn install --prod

RUN yarn add webpack webpack-node-externals tsconfig-paths-webpack-plugin -D

RUN yarn build

RUN yarn remove webpack webpack-node-externals tsconfig-paths-webpack-plugin

COPY dist /app/dist

CMD [ "yarn", "start" ]
