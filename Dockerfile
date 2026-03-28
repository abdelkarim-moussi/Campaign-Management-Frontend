# Stage 1: Build
FROM dhi.io/node:24-alpine3.22-dev AS builder

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install --legacy-peer-deps

COPY . .
RUN npm run build -- --configuration=production

FROM dhi.io/nginx:1.28.0-alpine3.21-dev AS runner

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /app/dist/*/browser /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]