FROM node:20-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta do Express
EXPOSE 3000

CMD ["npm", "run", "dev"]