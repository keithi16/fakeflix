# Ciclo de Vida de Conteúdo & Pipeline de Publicação — Documento de Requisitos de Produto (PRD)

**Autor:** Produto  
**Status:** Rascunho — Aguardando Revisão de Engenharia  
**Última atualização:** 31/03/2026  
**Versão:** 0.1

---

## Contexto

A Fakeflix hoje trata a criação de conteúdo como um evento atômico: no momento em que um gerente de conteúdo cadastra um filme ou série via API administrativa, ele aparece imediatamente no catálogo público. Não existe nenhum conceito de rascunho, revisão, agendamento ou arquivamento.

Isso gera três problemas concretos:

1. **Exposição acidental** — Conteúdos incompletos (sem thumbnail, sem sinopse revisada, sem classificação etária processada) ficam visíveis no catálogo no instante da criação. A equipe de conteúdo precisa "correr" para preencher os metadados antes que algum usuário tropece no título.

2. **Ausência de controle editorial** — Não há como preparar um lançamento com antecedência. Quando a Fakeflix quer estrear um título na sexta-feira à noite (horário de maior audiência), alguém precisa estar logado naquele exato momento para cadastrar manualmente. Não existe agendamento.

3. **Catálogo poluído** — Conteúdos que saíram de licença ou que a equipe editorial decidiu descontinuar permanecem no catálogo para sempre. A única opção hoje é deletar o registro do banco — operação destrutiva, irreversível e que não preserva histórico de métricas.

Plataformas como Netflix, Disney+ e HBO Max operam com pipelines de publicação sofisticados que separam claramente a fase de preparação da fase de distribuição. A ausência dessa separação na Fakeflix é uma dívida de produto que limita a qualidade percebida do catálogo e a confiança da equipe editorial na plataforma.

---

## Definição do Problema

**Para a equipe de conteúdo:** Publicar um título na Fakeflix é estressante e arriscado. Não há como preparar o conteúdo com calma, revisar metadados, verificar a classificação etária e agendar uma data de estreia. Qualquer erro fica imediatamente visível para todos os usuários.

**Para os usuários:** Ocasionalmente o catálogo exibe conteúdos com metadados incompletos — sem thumbnail, com descrições placeholder ou sem classificação etária definida. Isso passa uma impressão de baixa qualidade da plataforma.

**Para o negócio:** Não conseguimos fazer lançamentos coordenados (pré-anúncio + data de estreia), não conseguimos remover conteúdos sem destruir dados históricos, e não temos visibilidade sobre em que estado cada conteúdo está no pipeline editorial. Isso impacta diretamente a qualidade percebida do catálogo e a capacidade de executar estratégias de conteúdo.

---

## Objetivos

### Objetivos Primários

- **Eliminar a exposição acidental de conteúdos incompletos** — zero itens sem thumbnail ou sem classificação etária visíveis no catálogo público
- **Dar à equipe editorial controle total sobre quando um conteúdo se torna visível** — suportando publicação manual, publicação agendada e arquivamento reversível
- **Garantir que o catálogo público exiba apenas conteúdos prontos e aprovados** — aplicando gates de qualidade obrigatórios antes da publicação

### Objetivos Secundários

- Criar visibilidade operacional sobre o pipeline editorial (quantos conteúdos em rascunho, em revisão, publicados, arquivados)
- Preservar todo o histórico de conteúdos arquivados para analytics e compliance — nunca mais depender de delete destrutivo
- Estabelecer a base para futuras funcionalidades de workflow (aprovação multi-etapa, preview para stakeholders, embargos regionais)

---

## Não está no escopo desta versão

| O quê | Por quê |
| --- | --- |
| Workflow de aprovação multi-etapa (ex: editor → revisor → diretor de conteúdo) | Complexidade organizacional; a V1 precisa apenas de transição manual de estados por qualquer admin |
| Preview público de conteúdo (link compartilhável antes da publicação) | Útil para press kits, mas adiciona complexidade de segurança; adiado para V1.1 |
| Disponibilidade regional (geo-restrictions) | Pertence a uma feature de licenciamento separada; o lifecycle é agnóstico de região |
| Versionamento de metadados (histórico de edições de título/sinopse) | Nice to have para compliance, mas não bloqueia o pipeline de publicação |
| Notificações automáticas para a equipe editorial (ex: "conteúdo X está em rascunho há 7 dias") | Operacional, mas pertence a uma feature de alertas; não ao core do lifecycle |
| Despublicação automática por expiração de licença | Requer integração com um sistema de licenciamento que ainda não existe |
| Publicação parcial (ex: publicar episódios 1-3 de uma temporada enquanto os demais seguem em rascunho) | A V1 opera no nível de conteúdo inteiro (filme/série); granularidade por episódio vem na V2 |

---

## Personas de Usuário

### Sofia — A Gerente de Conteúdo

Sofia é responsável por adicionar e manter títulos no catálogo da Fakeflix. Ela trabalha com antecedência: prepara metadados (título, sinopse, gêneros, thumbnails) dias antes da data de lançamento planejada. Hoje, ela precisa cronometrar o cadastro via API para coincidir com o horário de estreia — um processo manual e sujeito a erros.

**Necessidade:** Um pipeline que permita preparar conteúdos com calma em estado de rascunho, validar que tudo está completo antes de publicar, e agendar a publicação para uma data/hora futura.

---

### Ricardo — O Analista de Qualidade de Conteúdo

Ricardo revisa os metadados dos conteúdos antes que eles vão ao ar: verifica se a sinopse está bem escrita, se o thumbnail tem boa qualidade, se a classificação etária foi processada pelo pipeline de IA e se os gêneros estão corretos. Hoje ele não tem uma etapa formal para isso — precisa verificar correndo antes que Sofia cadastre o título.

**Necessidade:** Um estado de "em revisão" onde o conteúdo está completo mas ainda não público, dando tempo para validação de qualidade sem pressão de visibilidade.

---

### Maya — A Usuária Final

Maya abre a Fakeflix para assistir algo. Ela não sabe (nem deveria saber) que existe um pipeline editorial por trás. Para ela, o catálogo deveria sempre mostrar conteúdos prontos, com thumbnails bonitos, sinopses completas e classificação etária correta. Quando ela encontra um conteúdo "quebrado" (sem imagem, sem descrição), sua confiança na plataforma diminui.

**Necessidade:** Um catálogo que só exiba conteúdos completamente prontos — sem surpresas.

---

## Histórias de Usuário

### P0: Máquina de Estados do Conteúdo

**Como gerente de conteúdo**, quero que cada item de conteúdo (filme ou série) tenha um estado de publicação explícito, para que eu saiba exatamente em que fase do pipeline editorial ele está e tenha controle sobre quando ele se torna visível.

**Por que P0:** Esta é a capacidade fundacional. Todas as outras histórias dependem da existência de estados de publicação no modelo de dados.

**Estados e Transições:**

```
DRAFT → REVIEW → PUBLISHED → ARCHIVED
  ↑        ↓
  ←────────┘  (voltar para rascunho para correções)
              PUBLISHED → ARCHIVED (retirar do catálogo)
              ARCHIVED → PUBLISHED (republicar)
```

**Critérios de Aceite:**

1. QUANDO um conteúdo é criado via API administrativa ENTÃO ele SHALL ter o estado inicial `DRAFT` e NÃO SHALL ser visível no catálogo público
2. QUANDO um admin chama `PATCH /admin/content/:id/transition` com `targetState: REVIEW` ENTÃO o sistema SHALL transicionar o conteúdo de `DRAFT` para `REVIEW`, validando que a transição é permitida
3. QUANDO um admin chama a transição de `REVIEW` para `PUBLISHED` ENTÃO o sistema SHALL validar os gates de qualidade obrigatórios (ver P0: Gates de Qualidade) antes de permitir a transição
4. QUANDO um admin tenta uma transição inválida (ex: `DRAFT` direto para `PUBLISHED`, ou `ARCHIVED` para `REVIEW`) ENTÃO o sistema SHALL retornar `422 Unprocessable Entity` com uma mensagem descrevendo as transições permitidas a partir do estado atual
5. QUANDO o estado de um conteúdo muda ENTÃO o sistema SHALL registrar a transição com `previousState`, `newState`, `triggeredBy` (userId do admin) e `timestamp`
6. QUANDO um admin chama `GET /admin/content/:id` ENTÃO a resposta SHALL incluir o campo `publishingStatus` com o estado atual

---

### P0: Gates de Qualidade para Publicação

**Como analista de qualidade de conteúdo**, quero que o sistema impeça a publicação de conteúdos que não atendam critérios mínimos de qualidade, para que nenhum conteúdo incompleto chegue ao catálogo público.

**Por que P0:** Sem gates automáticos, a exposição acidental continua possível mesmo com a máquina de estados — basta um admin apressar a transição.

**Critérios de Aceite:**

1. QUANDO um admin tenta transicionar um conteúdo de `REVIEW` para `PUBLISHED` ENTÃO o sistema SHALL validar que o conteúdo possui: (a) pelo menos um thumbnail associado, (b) uma descrição não vazia com no mínimo 50 caracteres, (c) pelo menos um gênero atribuído, (d) classificação etária definida (campo `ageRecommendation` não nulo)
2. QUANDO um conteúdo é do tipo `TV_SHOW` ENTÃO o sistema SHALL adicionalmente validar que a série tem pelo menos 1 episódio associado
3. QUANDO qualquer gate de qualidade falha ENTÃO o sistema SHALL retornar `422` com um array de validações falhas, cada uma com `field`, `rule` e `message` descritivos
4. QUANDO um gate falha ENTÃO o estado do conteúdo SHALL permanecer inalterado (`REVIEW`)
5. QUANDO todos os gates passam ENTÃO a transição SHALL prosseguir normalmente e o conteúdo SHALL se tornar visível no catálogo público

---

### P0: Catálogo Filtra por Estado de Publicação

**Como usuário da Fakeflix**, quero que o catálogo só me mostre conteúdos que estão oficialmente publicados, para que eu nunca encontre títulos incompletos ou em preparação.

**Por que P0:** Esta é a razão de existir do lifecycle — sem essa filtragem, a máquina de estados é um overhead burocrático sem valor para o usuário final.

**Critérios de Aceite:**

1. QUANDO o catálogo público é consultado (GraphQL `listContent`, facades de catálogo) ENTÃO apenas conteúdos com `publishingStatus = PUBLISHED` SHALL ser retornados
2. QUANDO um conteúdo é transitado de `PUBLISHED` para `ARCHIVED` ENTÃO ele SHALL desaparecer do catálogo público em até 1 minuto (eventual consistency aceitável)
3. QUANDO um conteúdo é transitado para `PUBLISHED` ENTÃO ele SHALL aparecer no catálogo público em até 1 minuto
4. QUANDO a API administrativa lista conteúdos (`GET /admin/content`) ENTÃO ela SHALL retornar conteúdos de todos os estados, com um filtro opcional `?status=DRAFT,REVIEW`
5. QUANDO o módulo de recomendações consulta o catálogo via `ContentCatalogApi` ENTÃO ele SHALL receber apenas conteúdos `PUBLISHED` — a filtragem é responsabilidade do content, não do consumidor

---

### P1: Publicação Agendada

**Como gerente de conteúdo**, quero agendar a publicação de um conteúdo para uma data e hora futura, para que eu possa preparar lançamentos com antecedência e garantir que o conteúdo vai ao ar no momento ideal.

**Por que P1:** Alto valor para a persona da Sofia, mas o pipeline funciona sem isso (publicação manual é o fallback). P0 precisa estar sólido primeiro.

**Critérios de Aceite:**

1. QUANDO um admin transiciona um conteúdo para `REVIEW` ENTÃO ele SHALL poder informar opcionalmente um campo `scheduledPublishAt` com data e hora futura (UTC)
2. QUANDO `scheduledPublishAt` é informado ENTÃO o sistema SHALL validar que a data é no futuro (mínimo 15 minutos à frente) e que os gates de qualidade serão verificados no momento da publicação (não no momento do agendamento)
3. QUANDO a data agendada é atingida ENTÃO o sistema SHALL executar os gates de qualidade automaticamente; SE todos passarem, transicionar para `PUBLISHED`; SE algum falhar, marcar o conteúdo como `SCHEDULING_FAILED` e notificar via log estruturado
4. QUANDO um admin chama `GET /admin/content?status=REVIEW&scheduled=true` ENTÃO o sistema SHALL retornar conteúdos em revisão que possuem publicação agendada, com o campo `scheduledPublishAt`
5. QUANDO um admin chama `DELETE /admin/content/:id/schedule` ENTÃO o agendamento SHALL ser cancelado e o conteúdo permanecerá em `REVIEW` sem data agendada
6. QUANDO um agendamento é cancelado ou falha ENTÃO o registro SHALL preservar `scheduledPublishAt` original e adicionar `schedulingOutcome` (`CANCELLED` ou `FAILED_VALIDATION`) com timestamp

---

### P1: Arquivamento de Conteúdo

**Como gerente de conteúdo**, quero arquivar conteúdos que saíram de linha ou que não queremos mais exibir, sem perder os dados históricos, para que eu possa retirá-los do catálogo de forma segura e reversível.

**Por que P1:** Hoje a única forma de tirar conteúdo do catálogo é deletar o registro — operação destrutiva. Arquivamento é essencial para operações editoriais e compliance.

**Critérios de Aceite:**

1. QUANDO um admin transiciona um conteúdo `PUBLISHED` para `ARCHIVED` ENTÃO o conteúdo SHALL desaparecer do catálogo público, mas SHALL permanecer acessível via API administrativa
2. QUANDO um conteúdo é arquivado ENTÃO todos os seus dados (metadados, vídeos, thumbnails, métricas históricas) SHALL ser preservados integralmente
3. QUANDO um admin transiciona um conteúdo `ARCHIVED` de volta para `PUBLISHED` ENTÃO o sistema SHALL reexecutar os gates de qualidade antes de permitir a republicação
4. QUANDO um conteúdo é arquivado ENTÃO ele SHALL ser removido das fileiras de recomendação na próxima recomputação, mas SHALL permanecer na fileira "Continue Assistindo" de usuários que já começaram a assisti-lo (com indicação visual de "conteúdo indisponível" — responsabilidade do frontend, fora do escopo de backend)
5. QUANDO a API administrativa lista conteúdos arquivados (`GET /admin/content?status=ARCHIVED`) ENTÃO a resposta SHALL incluir `archivedAt` e `archivedBy`

---

### P1: Dashboard de Estado do Pipeline

**Como gerente de conteúdo**, quero ter visibilidade sobre quantos conteúdos estão em cada estado do pipeline, para que eu possa identificar gargalos e planejar o calendário editorial.

**Por que P1:** Sem essa visibilidade, a equipe editorial opera às cegas. É uma consulta simples sobre dados que já existem com a máquina de estados.

**Critérios de Aceite:**

1. QUANDO um admin chama `GET /admin/content/pipeline/summary` ENTÃO o sistema SHALL retornar contagens por estado: `{ draft: N, review: N, published: N, archived: N }`
2. QUANDO um admin chama `GET /admin/content/pipeline/summary?breakdown=contentType` ENTÃO o sistema SHALL retornar contagens agrupadas por `contentType` (MOVIE, TV_SHOW) e estado
3. QUANDO um admin chama `GET /admin/content/pipeline/recent-transitions` ENTÃO o sistema SHALL retornar as últimas 50 transições de estado, com `contentId`, `title`, `previousState`, `newState`, `triggeredBy` e `timestamp`, ordenadas por timestamp decrescente

---

### P2: Histórico de Transições (Audit Trail)

**Como gerente de conteúdo**, quero consultar o histórico completo de transições de estado de um conteúdo específico, para ter rastreabilidade de quem fez o quê e quando no pipeline editorial.

**Por que P2:** Rastreabilidade é importante para governança e debugging operacional, mas não bloqueia as operações do dia a dia.

**Critérios de Aceite:**

1. QUANDO um admin chama `GET /admin/content/:id/transitions` ENTÃO o sistema SHALL retornar o histórico completo de transições daquele conteúdo, ordenado do mais recente para o mais antigo
2. QUANDO uma transição é registrada ENTÃO ela SHALL incluir: `id`, `previousState`, `newState`, `triggeredBy` (userId), `timestamp`, `reason` (opcional — texto livre que o admin pode informar ao transicionar)
3. QUANDO um admin transiciona um conteúdo de `REVIEW` de volta para `DRAFT` ENTÃO ele SHALL poder informar opcionalmente um `reason` descrevendo o motivo da rejeição
4. QUANDO o histórico de transições é consultado ENTÃO ele SHALL incluir transições automáticas (ex: publicação agendada) com `triggeredBy: SYSTEM`

---

### P2: Transição em Lote (Bulk)

**Como gerente de conteúdo**, quero transicionar múltiplos conteúdos de estado ao mesmo tempo, para que eu possa publicar ou arquivar um lote de títulos de uma vez sem precisar fazer uma chamada por conteúdo.

**Por que P2:** Otimização operacional. A Sofia gerencia dezenas de títulos por semana; transições individuais são tediosas. Mas a funcionalidade individual (P0) é suficiente para o lançamento.

**Critérios de Aceite:**

1. QUANDO um admin chama `POST /admin/content/bulk-transition` com `contentIds[]` e `targetState` ENTÃO o sistema SHALL tentar transicionar cada conteúdo individualmente
2. QUANDO qualquer item do lote falha (transição inválida ou gate de qualidade) ENTÃO o sistema SHALL continuar processando os demais e retornar um resultado parcial: `{ succeeded: [{id, newState}], failed: [{id, reason}] }`
3. QUANDO o lote excede 50 itens ENTÃO o sistema SHALL retornar `400 Bad Request` com mensagem de limite
4. QUANDO transições em lote são executadas ENTÃO cada transição individual SHALL gerar seu próprio registro de audit trail (não um registro único para o lote)

---

## Métricas e Critérios de Sucesso

| Métrica | Baseline (atual) | Meta (pós-lançamento) |
| --- | --- | --- |
| Conteúdos publicados sem thumbnail | Desconhecido (sem controle) | 0 (garantido por gates) |
| Conteúdos publicados sem classificação etária | Desconhecido | 0 (garantido por gates) |
| Tempo médio de preparação (criação → publicação) | n/a | Mensurável e visível |
| Conteúdos publicados via agendamento (vs. manual) | 0% | > 30% após 1 mês |
| Conteúdos arquivados (vs. deletados) | 0% | 100% (delete não mais usado) |
| Incidentes de "conteúdo incompleto no catálogo" reportados | ~2/semana (estimativa) | 0 |

---

## Dependências

| Dependência | Status | Responsável | Observações |
| --- | --- | --- | --- |
| `content/management` — entidade `ContentItem` e `ContentRepository` | Disponível | Engenharia | A máquina de estados será adicionada à entidade existente |
| `content/media` — pipeline de classificação etária (age recommendation) | Disponível | Engenharia | Gate de qualidade depende do `ageRecommendation` ser preenchido pelo pipeline de IA |
| `content/catalog` — `ListContentUseCase` e `ContentCatalogFacade` | Disponível (stub) | Engenharia | O use case hoje retorna `[]`; precisa ser implementado com filtro por `publishingStatus` |
| `content/shared` — entidade `Thumbnail` | Disponível | Engenharia | Gate de qualidade verifica existência de thumbnail |
| `recommendations` — `ContentCatalogApi` | Disponível | Engenharia | Deve consumir apenas conteúdos `PUBLISHED`; a filtragem será transparente via facade |
| `identity` — autenticação de admin | Disponível | Engenharia | Endpoints administrativos precisam de guard de autenticação |

---

## Questões em Aberto

| # | Questão | Responsável | Prazo |
| --- | --- | --- | --- |
| QA-01 | Quando um conteúdo é arquivado e o usuário já iniciou a assistir, devemos permitir que ele termine (acesso pós-arquivamento temporário) ou cortamos imediatamente? | Produto + Jurídico | Antes de P1 iniciar |
| QA-02 | O estado `REVIEW` deve impedir edições nos metadados, ou apenas impedir a visibilidade pública? (Lockdown vs. soft review) | Produto | Planejamento do sprint |
| QA-03 | Devemos emitir eventos de domínio nas transições de estado (ex: `ContentPublished`, `ContentArchived`) para que outros módulos possam reagir? Ou a abordagem pull via facade é suficiente para a V1? | Engenharia | Design técnico |
| QA-04 | O agendamento de publicação deve usar cron job ou BullMQ delayed jobs? Implicações de infraestrutura e precisão de timing. | Engenharia | Design técnico |
| QA-05 | A publicação agendada que falha por gates de qualidade deve transicionar para um estado `SCHEDULING_FAILED` ou retornar para `DRAFT`? | Produto | Antes de P1 iniciar |

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Dados legados sem estado de publicação quebram catálogo após migração | Alta | Alto | Migração de dados deve atribuir `PUBLISHED` a todos os conteúdos existentes — garantir backward compatibility total |
| Gates de qualidade bloqueiam publicação porque pipeline de IA (age recommendation) é lento | Média | Alto | Definir SLA para o pipeline de IA; considerar publicação condicional com warning se ageRecommendation demorar >24h |
| Equipe editorial contorna a máquina de estados editando direto no banco | Baixa | Médio | Garantir que a API é a única interface; não expor acesso direto ao banco para a equipe de conteúdo |
| Agendamento falha silenciosamente (job não executado) | Média | Alto | Logging estruturado obrigatório; alerta se conteúdo agendado não transicionou no horário esperado |
| Filtro de `publishingStatus` esquecido em nova query/endpoint futuro expõe rascunhos | Média | Alto | Encapsular a filtragem no repository/facade — nunca depender do chamador lembrar de filtrar |
