# Build stage
FROM node:lts-alpine AS builder

WORKDIR /src

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile
COPY . .

ARG APP_NAME=$APP_NAME

RUN npx nx build ${APP_NAME}

FROM node:20-alpine AS production
WORKDIR /src

# Define build arguments with defaults
ARG APP_COMMAND="node PLEASE OVERRIDE"
ARG APP_PORT=3000
ENV APP_COMMAND=$APP_COMMAND
ENV APP_PORT=$APP_PORT


# Set environment variables
ENV NODE_ENV=production

COPY package.json yarn.lock ./

COPY --from=builder /src/node_modules ./node_modules
COPY --from=builder /src/dist ./dist

# Add a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Set ownership and permissions
RUN chown -R nestjs:nodejs /src
USER nestjs

# Expose the API port
EXPOSE $APP_PORT

# Command to run the application
CMD $APP_COMMAND