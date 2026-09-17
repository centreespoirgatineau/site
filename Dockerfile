# Two stages: Node assembles the pages, nginx serves them. The final image holds
# nothing but nginx and the static files — no Node, no source, about 50 MB.
FROM node:22-alpine AS build
WORKDIR /site
COPY build ./build
COPY src ./src
RUN node build/build.mjs

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/security.inc /etc/nginx/conf.d/security.inc
COPY --from=build /site/public /usr/share/nginx/html
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
