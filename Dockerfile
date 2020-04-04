FROM node:stretch-slim

WORKDIR /usr/delivery

COPY *.json ./
COPY *.js ./

RUN npm install
EXPOSE 5004

CMD ["node", "delivery-server.js"]
