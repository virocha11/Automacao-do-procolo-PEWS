FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expõe a porta do React (Vite costuma usar 5173)
EXPOSE 5173

# Com volume montando o código em /app, o node_modules do build pode não ser o que roda.
# Instala dependências ao subir o container para manter package.json e node_modules alinhados.
CMD ["sh", "-c", "npm install && npm run dev"]