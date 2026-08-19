FROM node:24-alpine
WORKDIR /app
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]