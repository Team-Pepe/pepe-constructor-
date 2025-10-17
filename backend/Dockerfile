# Etapa de construcción
FROM node:20-alpine as builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install

# Generar clientes Prisma
RUN npm run prisma:generate

# Copiar el resto del código
COPY . .

# Etapa de producción
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de la etapa de construcción
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

# Exponer puerto
EXPOSE 5000

# Comando para iniciar la aplicación
CMD ["sh", "-c", "npm start"]