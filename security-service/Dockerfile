FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
RUN addgroup -S app && adduser -S app -G app
USER app
EXPOSE 4000
CMD ["npm", "run", "start"]
