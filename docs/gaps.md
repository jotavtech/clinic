# Revisão de gaps — 9 de novembro de 2026

## Corrigido nesta entrega

- Telefone vazio/inválido, nome só com espaços, serviço inválido, data inexistente, data/horário no passado e horários fora do funcionamento. Validação compartilhada entre navegador e API; telefone com máscara é normalizado.
- Diferenças de fuso no calendário: datas civis são preservadas, finais de semana usam o dia correto e agendamentos futuros consideram America/Sao_Paulo. Calendário em português.
- Seleções de serviço e horário controladas, incluindo limpeza após sucesso e troca da data. Falhas de envio preservam o preenchimento.
- Cliente HTTP único com tempo limite, mensagens para falha de rede, resposta HTML/JSON inválida e sessão expirada; limpeza de dados privados do cache no logout/expiração.
- Painel distingue falha de consulta de ausência de dados e oferece nova tentativa. Galeria oferece nova tentativa e imagem substituta local, sem ciclo de erros em um serviço externo.
- Menu móvel com nome acessível e estado expandido; abas e modal administrativo ajustados a telas pequenas; tema fixado ao visual claro existente, evitando contraste quebrado por preferência escura do dispositivo.
- Upload sincroniza a imagem editada, aceita teclado, bloqueia envios simultâneos, tem tempo limite e impede salvar enquanto a imagem está sendo enviada. Tipos e limite de upload têm resposta de erro consistente.
- Exclusão de profissional exige confirmação; botões de exclusão ficam desabilitados durante a operação. Tela 404 em português com retorno ao início.
- Leituras e alterações administrativas de agendamentos, referências e estatísticas exigem sessão. Cadastro público de agendamento não aceita status/código de referência forjados. IDs e alterações parciais são validados.
- Novos usuários têm hash bcrypt. Senhas antigas são atualizadas após login válido, a sessão é regenerada no login, e logs de credenciais/dados de resposta foram removidos. SESSION_SECRET exigido em produção e cookies seguros em HTTPS.
- Confirmação de agendamento reutiliza a referência existente. Contadores de indicação incrementam uma unidade, em vez de somar novamente o total acumulado.
- Backend de desenvolvimento alinhado ao proxy do Vite, caminho de arquivos de produção corrigido para dist/public, respostas 404 JSON para API e tratamento de erros sem relançar a exceção e derrubar o servidor.
- Adaptador Drizzle antigo incompatível substituído por alias do armazenamento Prisma ativo; TypeScript volta a passar. Documentação e exemplo de ambiente alinhados ao MySQL real do schema.
- Arquivos de ambiente, cookie e banco local retirados do versionamento atual e ignorados. Arquivos locais permanecem preservados; o histórico Git não foi reescrito.

## Pendências prioritárias

| Prioridade | Gap | Próximo passo |
| --- | --- | --- |
| Alta | Sessões ainda usam MemoryStore e se perdem em reinícios; múltiplas instâncias não compartilham login. | Configurar store persistente compatível com a hospedagem (Redis ou MySQL) e validar proxy/HTTPS. |
| Alta | Agendamento, criação de indicação e atualização de contadores ocorrem em operações separadas. Uma falha parcial pode criar um agendamento mesmo quando o cliente recebe erro. | Usar transação Prisma e chave de idempotência para reenvios. |
| Alta | Sem controle de disponibilidade por sala/profissional e sem restrição de conflito no banco. | Definir capacidade e regra de alocação com a clínica, depois impor conflitos de forma transacional. |
| Alta | Credenciais e dados locais já estiveram no histórico público. | Rotacionar segredos de hospedagem/Cloudinary/banco, revogar sessões antigas e decidir sobre limpeza do histórico. Nenhuma credencial externa foi alterada nesta entrega. |
| Alta | Login/cadastro público sem limitação de tentativas ou proteção contra abuso. | Aplicar limites por origem e limites de requisição no app/proxy, com testes que evitem bloquear clientes legítimos. |
| Média | Migração de senhas depende do primeiro login; a checagem legada ainda existe para contas antigas. | Migrar contas restantes em ambiente autorizado, revisar senhas padrão e remover o fallback. |
| Média | Descontos ainda precisam de consumo atômico e validação de regras de indicação (autoindicação, fraude, cancelamentos). | Atualização condicional no banco e política de concessão/reversão. |
| Média | Modelos Drizzle compartilhados e Prisma divergem (ContactForm.service, nulabilidade e tipos de datas). Há casts e operações que escondem erros do banco como não encontrado/lista vazia. | Consolidar DTOs/schemas e propagar falhas operacionais corretamente. O alias antigo foi corrigido, mas não há migração completa de modelos nesta entrega. |
| Média | Frontend Vercel e API Express não têm implantação conjunta configurada. | Definir hospedagem efetiva para API + MySQL + Cloudinary e testar uma publicação em homologação. |
| Média | Bundle inicial permanece em torno de 709 kB minificado (222 kB gzip). | Separar páginas administrativas sob demanda e medir impacto antes de ajustar dependências. |
| Média | Sem automação CI, ambiente de homologação, backup/restauração e testes com serviços reais. | Configurar CI e integração com base e Cloudinary de teste; revisar dependências e seus avisos de descontinuação. |
| Baixa | Imagens e fontes externas e várias animações afetam carregamento e screenshots de seções fora da tela. | Otimizar mídia, hospedagem de fontes e comportamento de movimento reduzido. |

## Validação

- `npm run check`: passou.
- `npm test`: 6 testes passaram, com casos de datas/telefones/horários, contador de indicações, cliente HTTP, autenticação, validação de API e upload inválido. Storage substituído por fixtures; sem conexão com banco.
- `npm run build`: passou; aviso de tamanho do bundle registrado acima.
- Chromium com viewport 390×844 e 1440×1000: galeria com erro e nova tentativa, menu móvel, telefone inválido, horários de sábado, falha/reenvio/sucesso e limpeza do formulário, login incorreto/correto, erro no painel e logout. Sem erro JavaScript não tratado e sem rolagem horizontal nesses fluxos. APIs e terceiros simulados.
- Servidor com `NODE_ENV=production` e configuração local fictícia: `/`, `/login` e imagem local respondem 200; endpoints privados respondem 401; API inexistente responde 404 JSON; JSON malformado responde 400 e o servidor continua disponível.
- MySQL, Cloudinary real, persistência, concorrência e deploy externo não foram exercitados. Não foram executadas migrações nem escritas no banco existente.

Para reproduzir o teste de navegador: execute `npm run build`, inicie `npx vite preview --host 127.0.0.1 --port 4173` em outro terminal e rode `npm run test:browser`. Requer Chromium instalado (`CHROMIUM_PATH`) ou `npx playwright install chromium`. O teste usa APIs fictícias e um relógio fixo; screenshots ficam em `/tmp/clinic-browser-artifacts` (ou `ARTIFACT_DIR`).
