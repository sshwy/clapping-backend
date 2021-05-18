# syntax=docker/dockerfile:1
FROM node:latest
ENV NODE_ENV=production
EXPOSE 3000

WORKDIR /app
COPY ["package.json", "."]
RUN npm install
ADD ["./dist", "."]

CMD node app.js -p 3000