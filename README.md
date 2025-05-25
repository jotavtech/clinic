# Clínica Executivas

## Configuração do Ambiente

1. Clone o repositório
```bash
git clone [URL_DO_REPOSITÓRIO]
cd clinic-2
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo de variáveis de ambiente
cp .env.example .env

# Edite o arquivo .env com suas configurações
# Você precisará configurar:
# - DATABASE_URL (URL de conexão com o banco de dados PostgreSQL)
# - JWT_SECRET (Chave secreta para autenticação)
# - Outras variáveis conforme necessário
```

4. Execute as migrações do banco de dados
```bash
npx prisma migrate dev
```

5. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

## Estrutura do Projeto

- `client/`: Frontend da aplicação (React + Vite)
- `server/`: Backend da aplicação (Node.js + Express)
- `prisma/`: Configurações e migrações do banco de dados
- `shared/`: Tipos e schemas compartilhados

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Compila o projeto para produção
- `npm start`: Inicia o servidor em modo produção

## Tecnologias Utilizadas

- Frontend: React, TypeScript, Vite, TailwindCSS
- Backend: Node.js, Express, TypeScript
- Banco de Dados: PostgreSQL, Prisma
- Outros: JWT para autenticação 