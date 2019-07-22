FROM node:10

WORKDIR /opt/openid
COPY package.json .
COPY package-lock.json
COPY lib/ ./lib

RUN npm install

CMD ["node", "."]

