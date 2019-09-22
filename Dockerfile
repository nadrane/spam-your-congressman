FROM node:12.10.0-alpine

WORKDIR /usr/src/app

RUN npm i -g yarn

COPY data/ data/

COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn

COPY src/ src/

COPY tsconfig.json tsconfig.json
RUN yarn build
EXPOSE 8080

CMD ["yarn", "start"]
