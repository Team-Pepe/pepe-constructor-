# Etapa de construcción
FROM node:20-alpine as build

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM nginx:alpine

# Copiar archivos de construcción a nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer puerto
EXPOSE 4000

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]

# Etapa de desarrollo
FROM node:20-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto de Vite
EXPOSE 3000

# Comando para desarrollo
CMD ["npm", "run", "dev", "--", "--host"]