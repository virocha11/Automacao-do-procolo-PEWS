FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expõe a porta do React (Vite costuma usar 5173)
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]