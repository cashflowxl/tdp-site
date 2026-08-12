FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json ./
COPY server.cjs ./
RUN mkdir -p /data
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787
ENV DATABASE_PATH=/data/lingdi.sqlite
EXPOSE 8787
VOLUME ["/data"]
CMD ["node", "server.cjs"]
