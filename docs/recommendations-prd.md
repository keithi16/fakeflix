# Recomendações — Documento de Requisitos de Produto (PRD)

**Autor:** Produto  
**Status:** Rascunho — Aguardando Revisão de Engenharia  
**Última atualização:** 26/03/2026  
**Versão:** 0.1

---

## Contexto

A Fakeflix não possui nenhuma camada de personalização. Todos os usuários que abrem o app veem exatamente o mesmo catálogo de conteúdo, na mesma ordem. Para encontrar algo para assistir, o usuário precisa navegar manualmente — o que gera fricção, aumenta a carga cognitiva e reduz a profundidade das sessões.

Os dados de analytics (agora em coleta) mostram que **o usuário médio navega por 4 a 7 minutos antes de dar play em qualquer coisa**, e que **23% das sessões encerram sem nenhum evento de play** — o usuário saiu sem encontrar algo que quisesse assistir. Esse é um sinal direto de churn.

Pesquisas internas da Netflix mostraram que 80% do conteúdo assistido na plataforma vem diretamente de uma superfície de recomendação. Estamos muito longe disso. Fechar essa lacuna é o investimento de produto com maior alavancagem que podemos fazer neste trimestre.

---

## Definição do Problema

**Para os usuários:** Encontrar conteúdo na Fakeflix dá muito trabalho. Usuários que não sabem exatamente o que querem assistir frequentemente desistem e saem. Não há nenhum sinal de que a plataforma os conhece — a experiência parece genérica.

**Para o negócio:** Sem uma camada de personalização, não conseguimos melhorar a retenção, não conseguimos dar visibilidade a conteúdos de cauda longa (alto custo de produção, baixa descoberta orgânica) e não conseguimos nos diferenciar dos concorrentes. Também estamos navegando às cegas sobre quais recomendações gerariam mais engajamento.

---

## Objetivos

### Objetivos Primários

- **Reduzir o "tempo para o play"** — o tempo entre o usuário abrir o app e pressionar play — da média atual de 4–7 minutos para menos de 2 minutos
- **Aumentar a taxa de descoberta de conteúdo** — crescer o percentual de eventos de play originados de uma superfície de recomendação para >40% até o final do trimestre
- **Melhorar a profundidade de sessão** — aumentar o percentual de sessões com mais de um evento de play de 31% para 45%

### Objetivos Secundários

- Dar aos gerentes de conteúdo a capacidade de impulsionar manualmente títulos específicos nas superfícies de recomendação (controle editorial)
- Dar visibilidade a conteúdos com baixa descoberta orgânica, mas alta taxa de conclusão (joias escondidas)
- Criar a base de dados para futuro teste A/B de algoritmos de recomendação

---

## Não está no escopo desta versão

| O quê                                                                 | Por quê                                                                                    |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Personalização em tempo real (alterações enquanto o usuário navega)   | Complexidade de infraestrutura; recomendações computadas em lote são suficientes para a V1 |
| Filtragem colaborativa ("usuários como você também assistiram")       | Requer infraestrutura significativa de ML; adiado para V2                                  |
| Recomendações sociais ("seus amigos assistiram")                      | Não existe grafo social na plataforma ainda                                                |
| Recomendações por e-mail / push notification                          | Responsabilidade de outro canal; pertence à feature de notificações                        |
| Explicação de por que algo foi recomendado ("Porque você assistiu X") | UX útil, mas adiciona complexidade à V1; adicionar na V1.1                                 |
| Exclusão de conteúdo com base em controles parentais                  | O módulo de perfis ainda não existe; adicionar quando perfis for lançado                   |
| Teste A/B de estratégias de recomendação                              | O módulo de experimentos é uma frente de trabalho separada                                 |

---

## Personas de Usuário

### Maya — A Usuária Casual

Maya abre a Fakeflix 3 a 4 vezes por semana, geralmente à noite. Ela não tem um título específico em mente — quer que a plataforma traga algo bom. Assiste principalmente dramas e documentários. Ela cancelou um concorrente porque "nunca conseguia achar nada para assistir."

**Necessidade:** Uma tela inicial que imediatamente traga conteúdos de que ela vai gostar, sem exigir nenhuma navegação.

---

### Carlos — O Usuário Avançado

Carlos assiste diariamente e tem preferências de gênero fortes (ficção científica, ação). Ele busca ativamente novos conteúdos nos seus gêneros preferidos e fica frustrado quando a tela inicial não é atualizada com base no que ele já assistiu.

**Necessidade:** Recomendações que pareçam frescas e reflitam sua atividade recente. Conteúdos que ele já concluiu devem desaparecer das fileiras de recomendação.

---

### Sofia — A Gerente de Conteúdo (Interna)

Sofia gerencia o catálogo da Fakeflix. Ela quer promover conteúdos recém-adicionados ou campanhas específicas (ex: uma retrospectiva de um diretor). Não quer que o algoritmo enterre conteúdos que ela está ativamente tentando destacar.

**Necessidade:** Uma interface administrativa para impulsionar ou fixar títulos específicos nas superfícies de recomendação, com visibilidade sobre como essas escolhas editoriais estão performando.

---

## Histórias de Usuário

### P0: Fileira Personalizada na Tela Inicial ("Recomendado para Você")

**Como usuário logado**, quero ver uma fileira personalizada de conteúdos na tela inicial, adaptada às minhas preferências de gênero e histórico de visualização, para que eu não precise navegar para encontrar algo de que vou gostar.

**Por que P0:** Esta é a superfície principal. Todos os outros tipos de recomendação são extensões desta capacidade central.

**Critérios de Aceite:**

1. QUANDO um usuário abre o app ENTÃO a tela inicial SHALL exibir uma fileira "Recomendado para Você" com até 20 itens de conteúdo, ordenados por score de personalização
2. QUANDO um usuário tem histórico de visualização ENTÃO as recomendações SHALL pesar suas principais afinidades de gênero (do analytics) para ranquear conteúdos que ele ainda não assistiu
3. QUANDO um usuário não tem histórico de visualização (novo usuário) ENTÃO o sistema SHALL usar conteúdo em tendência como fallback para a fileira "Recomendado para Você"
4. QUANDO um usuário concluiu um conteúdo (>=90% assistido) ENTÃO esse conteúdo NÃO SHALL aparecer nas suas recomendações personalizadas
5. QUANDO as afinidades de gênero de um usuário mudam (novos eventos de visualização processados) ENTÃO suas recomendações SHALL ser atualizadas em até 24 horas (próxima recomputação agendada)
6. QUANDO um usuário não está logado ENTÃO ele SHALL ver uma fileira baseada em tendências (sem personalização)

---

### P0: Fileira "Continue Assistindo"

**Como usuário logado**, quero ver os conteúdos que comecei mas não terminei em uma fileira dedicada "Continue Assistindo", para que eu possa retomar imediatamente sem precisar buscar.

**Por que P0:** Este é o redutor mais direto do "tempo para o play". Usuários que começaram algo são o grupo de maior intenção.

**Critérios de Aceite:**

1. QUANDO um usuário assistiu parcialmente a um conteúdo (>5% e <90% completo) ENTÃO ele SHALL aparecer na fileira "Continue Assistindo", ordenado pelo mais recentemente assistido primeiro
2. QUANDO um usuário concluiu um conteúdo (>=90%) ENTÃO ele SHALL ser removido de "Continue Assistindo" automaticamente
3. QUANDO um usuário clica em um item de "Continue Assistindo" ENTÃO o player SHALL retomar a partir da última posição conhecida
4. QUANDO "Continue Assistindo" tiver mais de 20 itens ENTÃO apenas os 20 mais recentemente assistidos SHALL ser exibidos
5. QUANDO um usuário remove um item de "Continue Assistindo" (descarte explícito) ENTÃO ele não SHALL reaparecer nessa fileira, mesmo que o usuário volte e reassista do início

---

### P1: Fileira "Em Alta Agora"

**Como usuário**, quero ver quais conteúdos estão populares na plataforma no momento, para poder assistir o que todo mundo está vendo.

**Por que P1:** Tendências são um sinal de alta confiança e baixa complexidade — exigem dados mínimos de personalização e funcionam para todos os usuários, incluindo novos.

**Critérios de Aceite:**

1. QUANDO um usuário visualiza a tela inicial ENTÃO uma fileira "Em Alta Agora" SHALL exibir os 20 conteúdos em tendência com base na computação diária de trending (do analytics)
2. QUANDO o conteúdo em tendência é recomputado diariamente ENTÃO a fileira SHALL refletir os rankings atualizados em até 1 hora após a conclusão da computação
3. QUANDO um item em tendência já foi concluído pelo usuário logado ENTÃO ele SHALL ainda aparecer em tendências (este é um sinal social, não pessoal)
4. QUANDO o conteúdo em tendência do dia atual ainda não foi computado ENTÃO o sistema SHALL exibir os resultados do dia anterior como fallback (nunca exibir uma fileira vazia)

---

### P1: Fileiras "Top em [Gênero]"

**Como usuário**, quero ver fileiras dedicadas para meus gêneros preferidos, com os melhores conteúdos nesses gêneros, para que eu descubra conteúdos dentro das minhas preferências.

**Por que P1:** Alto impacto para usuários avançados como Carlos. As fileiras de gênero são a expressão mais clara de "a plataforma me conhece."

**Critérios de Aceite:**

1. QUANDO um usuário tem scores de afinidade de gênero ENTÃO a tela inicial SHALL exibir até 3 fileiras de gênero, uma por gênero preferido, com rótulos como "Top em Drama", etc.
2. QUANDO os conteúdos das fileiras de gênero são computados ENTÃO eles SHALL ser ranqueados por um composto de taxa de conclusão e contagem de views dentro daquele gênero
3. QUANDO um usuário não tem afinidades de gênero ENTÃO as fileiras de gênero SHALL não ser exibidas (sem fileiras vazias)
4. QUANDO um conteúdo aparece em uma fileira de gênero ENTÃO ele SHALL ser filtrado para excluir conteúdos que o usuário já concluiu
5. QUANDO um gênero tem menos de 5 títulos disponíveis não assistidos para o usuário ENTÃO essa fileira de gênero SHALL ser suprimida

---

### P1: Fileira "Novidades" (Filtrada por Gênero)

**Como usuário**, quero ver conteúdos adicionados recentemente filtrados pelos gêneros de que gosto, para não perder títulos novos que combinam com meu gosto.

**Por que P1:** Novidades são um fator chave de retenção — dão ao usuário um motivo para voltar. Filtrar por afinidade de gênero as torna muito mais relevantes.

**Critérios de Aceite:**

1. QUANDO um conteúdo foi adicionado ao catálogo nos últimos 30 dias ENTÃO ele é considerado uma "Novidade"
2. QUANDO um usuário logado visualiza a tela inicial ENTÃO as novidades SHALL ser filtradas pelos gêneros que correspondem às suas 3 principais afinidades de gênero, ordenadas por data de lançamento decrescente
3. QUANDO um usuário não tem afinidades de gênero ENTÃO as novidades SHALL exibir todos os gêneros ordenados por data de lançamento
4. QUANDO há menos de 5 novidades correspondendo aos gêneros do usuário ENTÃO a fileira SHALL não ser exibida
5. QUANDO uma novidade já foi concluída pelo usuário ENTÃO ela SHALL ser excluída

---

### P2: Fileira "Porque Você Assistiu [X]" (Similaridade de Conteúdo)

**Como usuário**, quero ver conteúdos similares a um título que terminei recentemente, para que eu possa continuar aproveitando o mesmo tipo de conteúdo.

**Por que P2:** Sinal de alta personalização, mas requer dados de similaridade de conteúdo (tags, gêneros, elenco em comum). As superfícies de P1 não exigem isso e podem ser entregues primeiro.

**Critérios de Aceite:**

1. QUANDO um usuário conclui um conteúdo ENTÃO o sistema SHALL gerar uma fileira "Porque Você Assistiu [Título]" baseada no item concluído mais recentemente
2. QUANDO conteúdos similares são computados ENTÃO o sistema SHALL fazer correspondência por gêneros compartilhados, taxa de conclusão similar e tags em comum
3. QUANDO um usuário não concluiu nenhum conteúdo ENTÃO esta fileira SHALL não aparecer
4. QUANDO conteúdos similares incluem itens que o usuário já concluiu ENTÃO esses itens SHALL ser excluídos
5. QUANDO existem menos de 5 títulos similares ENTÃO esta fileira SHALL não ser exibida

---

### P2: Destaque Editorial (Admin)

**Como gerente de conteúdo**, quero promover manualmente títulos específicos nas superfícies de recomendação, para apoiar campanhas, lançamentos de novos conteúdos e programas editoriais.

**Por que P2:** Alto valor de negócio para a persona da Sofia. Necessário antes de executarmos campanhas promocionais. Não é necessário para o MVP de personalização.

**Critérios de Aceite:**

1. QUANDO um admin chama `POST /recommendations/admin/boost` com `contentId`, `surface` (ex: trending, personalised) e `expiresAt` opcional ENTÃO o sistema SHALL marcar aquele conteúdo para ranqueamento elevado naquela superfície
2. QUANDO o `expiresAt` de um item impulsionado tiver passado ENTÃO ele SHALL reverter automaticamente ao ranqueamento orgânico
3. QUANDO conteúdo impulsionado é ranqueado ENTÃO ele SHALL aparecer nas 5 primeiras posições da fileira relevante, independentemente do seu score orgânico
4. QUANDO um admin chama `GET /recommendations/admin/boosts` ENTÃO o sistema SHALL retornar todos os destaques ativos com suas superfícies, horários de expiração e metadados do conteúdo
5. QUANDO um usuário não-admin chama endpoints de admin ENTÃO o sistema SHALL retornar `403 Forbidden`
6. QUANDO um gerente de conteúdo remove um destaque ENTÃO o item SHALL retornar à sua posição orgânica no próximo ciclo de recomputação

---

### P3: Fileira "Joias Escondidas"

**Como usuário**, quero descobrir conteúdos de alta qualidade que a maioria das pessoas ainda não viu, para encontrar títulos únicos que talvez eu adore.

**Por que P3:** Uma superfície de recomendação diferenciada que destaca conteúdos de cauda longa com alta taxa de conclusão, mas baixa contagem de views — conteúdos que merecem seu lugar pela qualidade, não pela popularidade.

**Critérios de Aceite:**

1. QUANDO joias escondidas são computadas ENTÃO o sistema SHALL identificar conteúdos onde `completionRate >= 70%` E `totalViews <= 500` (baixa exposição, alto sinal de engajamento)
2. QUANDO um usuário visualiza a tela inicial ENTÃO uma fileira "Joias Escondidas" SHALL exibir até 10 desses itens, ponderados pelas afinidades de gênero do usuário
3. QUANDO um usuário já concluiu uma joia escondida ENTÃO ela SHALL ser excluída da sua fileira
4. QUANDO existem menos de 5 joias escondidas correspondendo aos gêneros do usuário ENTÃO a fileira SHALL não ser exibida

---

### P3: Rastreamento de Efetividade das Recomendações

**Como product manager**, quero saber quais recomendações estão sendo clicadas e quais levam a sessões de visualização reais, para que eu possa medir o impacto das recomendações e iterar no algoritmo.

**Por que P3:** É assim que provamos que a feature está funcionando. É importante, mas podemos lançar as recomendações e coletar dados na primeira iteração — o dashboard pode vir depois.

**Critérios de Aceite:**

1. QUANDO um usuário clica em um item recomendado ENTÃO o sistema SHALL registrar um evento de impressão com `userId`, `contentId`, `surface` (ex: `personalised`, `trending`, `genre_row`) e `rank` (posição na fileira)
2. QUANDO um usuário dá play em um conteúdo dentro de 5 minutos após clicar em uma recomendação ENTÃO o sistema SHALL registrar um evento de conversão vinculando o play à impressão da recomendação
3. QUANDO um product manager chama `GET /recommendations/admin/effectiveness` ENTÃO o sistema SHALL retornar métricas por superfície: `impressions`, `clicks`, `conversions`, `CTR`, `conversionRate`
4. QUANDO os parâmetros de query `from` e `to` são fornecidos ENTÃO as métricas SHALL ser filtradas para aquele intervalo de datas

---

## Métricas e Critérios de Sucesso

| Métrica                                                       | Baseline (atual) | Meta (final do trimestre)   |
| ------------------------------------------------------------- | ---------------- | --------------------------- |
| Tempo médio para o play (minutos)                             | 4–7 min          | < 2 min                     |
| % de eventos de play originados de superfície de recomendação | ~0%              | > 40%                       |
| Sessões com >1 evento de play                                 | 31%              | > 45%                       |
| Retenção em 30 dias                                           | A definir        | +8 pp vs. grupo de controle |
| Taxa de clique em "Continue Assistindo"                       | n/a              | > 60%                       |

---

## Dependências

| Dependência                                         | Status       | Responsável | Observações                                                         |
| --------------------------------------------------- | ------------ | ----------- | ------------------------------------------------------------------- |
| `analytics` — scores de afinidade de gênero         | Em andamento | Engenharia  | Histórias P1 dependem da facade `getUserGenreAffinities`            |
| `analytics` — histórico de visualização e conclusão | Em andamento | Engenharia  | "Continue Assistindo" e filtragem de conteúdo concluído exigem isso |
| `analytics` — conteúdo em tendência                 | Em andamento | Engenharia  | Fileira "Em Alta Agora" consome a facade `getTrendingContent`       |
| `content` — metadados do catálogo (gêneros, tags)   | Disponível   | Engenharia  | Similaridade de conteúdo e filtragem de fileiras de gênero          |
| `identity` — autenticação do usuário                | Disponível   | Engenharia  | Personalização exige contexto de usuário autenticado                |

---

## Questões em Aberto

| #     | Questão                                                                                                                                                                                   | Responsável        | Prazo                  |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------- |
| QA-01 | Qual é a cadência de atualização das recomendações personalizadas? Diária é a proposta — isso é aceitável para o produto considerando a atualidade dos dados vs. custo de infraestrutura? | Produto + Eng      | Planejamento do sprint |
| QA-02 | Conteúdos concluídos devem ficar fora das recomendações para sempre, ou ressurgir após 90 dias para incentivar uma reasistida?                                                            | Produto            | Planejamento do sprint |
| QA-03 | O destaque editorial substitui completamente a personalização, ou é um sinal aditivo?                                                                                                     | Produto            | Antes de P2 iniciar    |
| QA-04 | Qual é a estratégia de fallback para novos usuários sem histórico de visualização? Apenas tendências, ou coletamos preferências de gênero em um survey de onboarding?                     | Produto            | Planejamento do sprint |
| QA-05 | As recomendações precisam respeitar a disponibilidade de conteúdo por região/plano? (ex: um usuário do plano Standard não deve ver conteúdos que exigem Premium)                          | Produto + Jurídico | Antes de P0 ir ao ar   |

---

## Riscos

| Risco                                                    | Probabilidade | Impacto | Mitigação                                                                                                |
| -------------------------------------------------------- | ------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| Dados de analytics não prontos a tempo                   | Média         | Alto    | P0 de Recomendações depende de P3 de Analytics (afinidades de gênero). Alinhar marcos entre as equipes.  |
| Problema de cold start para novos usuários               | Alta          | Médio   | Desenhar o caminho de fallback explícito para tendências antes de P0 ir ao ar — não lançar sem ele       |
| Uso indevido de destaque editorial (excesso de boosts)   | Baixa         | Médio   | Adicionar limite: máximo de 3 destaques simultâneos por superfície; exigir data de expiração             |
| Fileiras de recomendação exibindo vazias na tela inicial | Média         | Alto    | Cada fileira tem uma regra de fallback ou supressão definida — nunca exibir uma fileira vazia com rótulo |
