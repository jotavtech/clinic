# Remodel do site e catálogo administrável

## O que mudou

O site passa a usar uma identidade de bem-estar em marfim e verde, componentes responsivos, ilustração local e ícones SVG. O site, a tela de login e o painel administrativo foram remodelados. As ofertas, preços e descrições explícitas fixas foram retirados do frontend. A versão não publica serviços de exemplo nem transfere as ofertas antigas para o novo catálogo.

O painel tem duas áreas novas:

- **Serviços**: cadastrar e editar nome, descrição, valor em reais, duração, imagem e status de publicação. Novos serviços começam como rascunhos. Arquivar remove do catálogo/agendamento, preservando o histórico. Serviços arquivados não podem ser editados ou reservados pela API pública.
- **Conteúdo do site**: nome da clínica, frase de apresentação, títulos e textos do início e da seção sobre, imagens, endereço, WhatsApp, e-mail e horários. Campos de contato vazios não aparecem no site. Imagens vazias usam a ilustração local, sem depender de fornecedores externos. Os textos genéricos de interface permanecem parte do layout.

O cadastro de profissionais existente continua disponível no painel. A apresentação de categorias de suíte foi removida do frontend; campos legados no banco foram preservados para compatibilidade. Perfis já gravados no banco não são apagados ou reescritos automaticamente: o administrador deve revisar textos e imagens existentes antes de publicar esta versão.

## Como o agendamento funciona

`GET /api/services` retorna somente serviços publicados e não arquivados. O cliente envia o ID como string em `service`. A API consulta o catálogo e usa o **nome e a duração registrados no servidor**, bloqueando IDs inexistentes/inativos e ignorando a duração adulterada no pedido.

O agendamento mantém um snapshot do nome/duração no modelo existente. Editar/arquivar serviços não muda agendamentos antigos. Preço é informativo; esta entrega não implementa cobrança online nem snapshot financeiro.

O calendário usa o fuso da clínica e os horários cadastrados. As opções começam em intervalos de 30 minutos a partir da abertura e só aparecem se toda a sessão couber antes do fechamento. Os fins de semana podem ser desativados. Isso valida o funcionamento, mas ainda **não reserva capacidade de sala/profissional nem resolve conflitos simultâneos**.

## Banco e publicação

O schema Prisma continua MySQL. Foram acrescentadas apenas as tabelas `Service` e `SiteSettings`. Não houve alteração no banco existente durante o desenvolvimento.

Para uma instalação existente, faça backup e aplique a atualização aditiva no ambiente de homologação antes de publicar o código:

```sh
npx prisma db execute --schema prisma/schema.prisma --file prisma/changes/catalog-and-content.sql
npx prisma generate
npm run check
npm test
npm run build
```

O SQL foi gerado comparando os schemas Prisma anterior/novo sem conexão com banco. Ele só cria as duas tabelas novas e não contém inserts, drops ou alterações nos registros existentes. Não reaplique esse SQL se as tabelas já existirem: confira o estado do banco primeiro. O projeto não possuía histórico de migrações com baseline; este arquivo é uma atualização explícita para a base existente.

Em uma base nova e isolada de desenvolvimento, `npx prisma db push` cria o schema completo. Não execute esse comando indiscriminadamente em produção.

Depois, entre no painel, revise **Conteúdo do site**, cadastre serviços e publique somente quando estiverem prontos. Sem serviços publicados, o catálogo exibe um estado vazio e o formulário de reserva fica bloqueado. Nenhum valor/nome de exemplo é inserido automaticamente.

O servidor precisa das mesmas configurações anteriores: MySQL, `SESSION_SECRET`, HTTPS/proxy e, para upload de imagens, Cloudinary. Fotos por URL HTTPS são aceitas no conteúdo e no cadastro de serviços. A Vercel estática sozinha continua sem hospedar esta API Express.

## Verificação

- TypeScript, geração Prisma e build de produção. Bundle inicial de aproximadamente 456 kB (145 kB gzip), com painel/login em chunks separados; sem o aviso anterior de chunk acima de 500 kB.
- 9 testes automatizados cobrem validação, telefone/fuso, horários configuráveis, duração adulterada, IDs inativos, permissões, rascunho/publicação/arquivamento, conteúdo e contadores de indicação.
- Chromium com dados fictícios testa criação de rascunho, ausência no site, publicação, seleção pelo card, reserva com falha e reenvio, limpeza do formulário, alteração de conteúdo/WhatsApp, fim de semana fechado, arquivamento, login e logout.
- Verificação de largura em 320, 390, 768 e 1440 px; capturas de site/painel em desktop e celular. Sem dependência de imagens externas para a identidade inicial.
- Integração real com MySQL/Cloudinary e aplicação do SQL precisam ser validadas em homologação. Nenhum dado de produção foi criado, excluído ou migrado.

Os demais gaps de infraestrutura, sessões persistentes, rate limiting, idempotência e capacidade de agenda continuam listados em [gaps.md](gaps.md).
