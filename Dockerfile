# Instalação das dependências
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Execução da aplicação
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY . .

# Expõe a porta padrão 
# (o Docker vai mapear com base no compose)
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "start"]