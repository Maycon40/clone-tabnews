FROM node:24.13

WORKDIR /home/node/app

COPY . .

RUN npm install

CMD ["npm", "run", "dev"]