# Remaster da identidade original

A interface volta à estrutura do projeto original, usando preto, branco e vermelho. Foram refinados espaçamentos, tipografia, bordas, botões, contraste, imagens e comportamento em telas pequenas.

## Escopo final

- Mesmas seções: início, contato rápido, sobre, serviços, profissionais, agendamento e rodapé.
- Mesmo painel com quatro áreas: profissionais, agendamentos, histórico e estatísticas.
- Mesmo formulário, serviços identificados pelo contrato original e mesmas rotas de API.
- Removidas as telas adicionais de catálogo e conteúdo, a configuração dinâmica de horários, as tabelas novas e o SQL da tentativa anterior. **Não é necessária aquela atualização de banco.** Nenhuma alteração dessa tentativa foi aplicada ao banco existente.
- Removidos os textos de ofertas sexuais do site e do seletor de agendamento, conforme solicitado anteriormente. A apresentação permanece voltada a massagem terapêutica e bem-estar. A imagem de abertura usa a referência de spa já presente na seção sobre, com alternativa visual escura se a imagem externa falhar.
- Mantidas as correções de confiabilidade e acesso administrativo da primeira entrega. Sem novos módulos, configurações ou integrações de negócio.

## Validação

`npm run check`, `npm run build` e os seis testes originais de regressão. Teste de navegador com API fictícia para formulário, login, galeria e painel em desktop/celular. Banco e Cloudinary reais não foram acessados. O aviso de tamanho do bundle original permanece.

O schema e a lógica de servidor correspondem à primeira entrega de correções, anterior ao catálogo administrável. O projeto continua usando MySQL/Prisma, SESSION_SECRET e HTTPS em produção, conforme README.
