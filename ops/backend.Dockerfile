# Backend Dockerfile
FROM node:20-alpine AS base
WORKDIR /workspace
COPY package*.json ./
RUN npm ci --ignore-scripts || npm i --ignore-scripts
COPY apps/backend ./apps/backend
WORKDIR /workspace/apps/backend
RUN npm ci --ignore-scripts || npm i --ignore-scripts
RUN npm run build || echo "build step will run in dev"
EXPOSE 3001
CMD ["npm", "run", "start"]
