# Clínica Executivas

Site e painel administrativo em React, TypeScript e Express. O armazenamento ativo é Prisma com **MySQL**, conforme `prisma/schema.prisma`.

## Interface

Remaster visual em preto, branco e vermelho, preservando a estrutura e os fluxos originais. Sem os módulos de catálogo/conteúdo ou novas tabelas da tentativa anterior. Veja [docs/remaster.md](docs/remaster.md).

## Desenvolvimento

Requer Node.js 20.19+ e uma base MySQL separada de produção.

```sh
npm install
cp .env.example .env
# Configure DATABASE_URL e Cloudinary no arquivo local.
npx prisma db push
npm run dev:server
```

O servidor atende API e frontend em `http://localhost:5000`. Alternativamente, `npm run dev:full` abre Vite e API separados; o proxy padrão aponta para a API na porta 5000. Se mudar essa porta no modo separado, ajuste o proxy do Vite também.

Para criar o primeiro administrador, configure `ADMIN_USERNAME` e `ADMIN_PASSWORD` localmente e execute `npm run admin:create`. Não existe criação automática de usuário com senha padrão.

## Verificação

```sh
npm run check
npm test
npm run build
```

Os testes de API usam fixtures em memória e não se conectam a um banco. A integração real com MySQL e Cloudinary precisa de um ambiente de homologação configurado.

## Produção

Execute `npm run build` e inicie com `NODE_ENV=production npm start`. Configure `DATABASE_URL`, `SESSION_SECRET` e Cloudinary no serviço de hospedagem. O servidor atende os arquivos em `dist/public` e exige HTTPS para o cookie de sessão em produção. A configuração considera um proxy reverso confiável; ajuste `trust proxy` à topologia da hospedagem.

O `vercel.json` existente só configura o build estático; ele não publica automaticamente esta API Express. Não publicar o frontend sozinho sem configurar a API.

Senhas novas usam bcrypt; senhas antigas em texto puro são convertidas após um login válido. Arquivos `.env`, cookies e bancos locais não devem ser versionados. Credenciais anteriormente publicadas precisam ser rotacionadas pelo responsável pela hospedagem; removê-las do código atual não apaga o histórico.

Veja [gaps e validação](docs/gaps.md) para as limitações conhecidas e próximos passos.
