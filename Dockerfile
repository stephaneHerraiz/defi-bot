#Build stage
FROM node:23-alpine AS build

WORKDIR /app

COPY package*.json .

RUN yarn

COPY . .

RUN yarn run build

#Production stage
FROM node:23-alpine AS production

# Update packages and Install cron
RUN apk add tini --no-cache --update

WORKDIR /app

COPY package*.json .

RUN yarn install --production

COPY --from=build /app/build ./dist

COPY --from=build /app/config /root/config

# Copy the crontab into place
COPY --from=build /app/crontab /etc/crontabs/root

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/usr/sbin/crond", "-f", "-l", "8"]