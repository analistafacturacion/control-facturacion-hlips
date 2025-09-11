# Frontend Dockerfile
FROM node:20-alpine AS base
WORKDIR /workspace
COPY package*.json ./
RUN npm ci --ignore-scripts || npm i --ignore-scripts
COPY apps/frontend ./apps/frontend
WORKDIR /workspace/apps/frontend
RUN npm ci --ignore-scripts || npm i --ignore-scripts
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
