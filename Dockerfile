# Imagen de Mini Inventario (Día 9).
# Base oficial de Node 22 en Alpine: pequeña y con la versión que pide package.json.
FROM node:22-alpine

# Carpeta de trabajo dentro del contenedor.
WORKDIR /app

# Modo producción: Express y npm omiten lo de desarrollo.
ENV NODE_ENV=production

# Primero solo los manifiestos, para que Docker reuse la capa de dependencias
# mientras package.json y package-lock.json no cambien.
COPY package.json package-lock.json ./

# Instala exactamente lo del lock y sin dependencias de desarrollo (sin Playwright).
RUN npm ci --omit=dev && npm cache clean --force
RUN npm run no-existe

# Copia solo el código que la app necesita. Nada de .env, tests ni entregas:
# las llaves llegan como variables de entorno al correr el contenedor.
COPY server.js ./
COPY public ./public

# No correr como root: la imagen de Node trae el usuario "node".
USER node

# Render asigna el puerto en PORT (10000 por defecto). server.js escucha en 0.0.0.0:PORT.
ENV PORT=10000
EXPOSE 10000

# Arranca el servidor.
CMD ["node", "server.js"]
