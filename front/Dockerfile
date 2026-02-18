# # ---------- Stage 1: Build React ----------
# FROM node:20-alpine AS build

# WORKDIR /app

# # Copy package files
# COPY package.json package-lock.json ./

# # FIX: Add --legacy-peer-deps to ignore the React 19 conflict
# RUN npm ci --legacy-peer-deps

# # Copy source code
# COPY . .

# # Build the app
# RUN npm run build

# # ---------- Stage 2: Serve with Nginx ----------
# FROM nginx:alpine

# # Remove default Nginx website
# RUN rm -rf /usr/share/nginx/html/*

# # Copy built React app (Vite uses /dist)
# COPY --from=build /app/dist /usr/share/nginx/html

# # Ensure you have your nginx.conf in the same folder as this Dockerfile
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# EXPOSE 5177

# CMD ["nginx", "-g", "daemon off;"]


# # ---------- Stage 1: Build ----------
# FROM node:20-alpine AS build

# WORKDIR /app

# # Copy package files
# COPY package.json package-lock.json ./

# # Install all dependencies (including dev dependencies)
# RUN npm ci --legacy-peer-deps

# # Copy the rest of the app
# COPY . .

# # Build the React app (output in /dist)
# RUN npm run build

# # ---------- Stage 2: Runtime ----------
# FROM node:20-alpine

# WORKDIR /app

# # Install only production dependencies
# COPY package.json package-lock.json ./
# RUN npm ci --omit=dev --legacy-peer-deps

# # Install Vite in production environment (needed for `vite preview`)
# RUN npm install vite --legacy-peer-deps

# # Copy built files from the build stage
# COPY --from=build /app/dist /app/dist

# EXPOSE 5177

# # Serve the built app with Vite preview
# CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5177"]

# ---------- Stage 1: Build React App ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

ENV VITE_SERVER_URL=https://portal.wisling.com

RUN printf 'server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / { try_files $uri $uri/ /index.html; }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx","-g","daemon off;"]
