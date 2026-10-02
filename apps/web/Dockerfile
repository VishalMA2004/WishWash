FROM node:24-alpine
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci
COPY apps/web ./apps/web
RUN npm run build --workspace @wishwash/web
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "@wishwash/web"]
