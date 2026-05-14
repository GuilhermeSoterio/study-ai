# Requisitos Funcionais — StudyBI (Tribunais TI)

> Documento gerado em 01/05/2026. Reflete o estado atual do código-fonte.

---

## Visão Geral

StudyBI é uma plataforma de inteligência de estudo voltada para candidatos de concursos públicos na área de TI (Tribunais). O sistema permite registrar e analisar sessões de questões, gerenciar flashcards com repetição espaçada, acompanhar evolução por disciplina/matéria, e gamificar o progresso do estudo.

**Stack:** React 18 + TypeScript + Vite · Zustand · Supabase (Auth + Postgres) · Go Backend (`localhost:8080`) · Chart.js · TipTap · Tailwind CSS

---

## RF01 — Autenticação

| ID | Requisito |
|---|---|
| RF01.1 | O sistema deve autenticar usuários via e-mail e senha usando Supabase Auth |
| RF01.2 | A sessão autenticada deve ser persistida entre recarregamentos de página via `onAuthStateChange` |
| RF01.3 | Ao fazer login, o sistema deve carregar todos os dados do usuário em uma única chamada `loadAll()` |
| RF01.4 | O sistema deve exibir um spinner de carregamento enquanto a sessão está sendo resolvida |
| RF01.5 | Usuários não autenticados devem ser redirecionados para a tela de login sem acesso a qualquer rota |
| RF01.6 | O logout deve limpar todo o estado da store e redirecionar para o login |

---

## RF02 — Registro de Sessão de Questões

| ID | Requisito |
|---|---|
| RF02.1 | O usuário deve poder selecionar uma disciplina a partir de lista hierárquica |
| RF02.2 | A seleção de matéria deve ser em cascata, exibindo apenas as matérias da disciplina selecionada |
| RF02.3 | O usuário deve informar o total de questões tentadas e o número de acertos |
| RF02.4 | O sistema deve exibir preview em tempo real do desempenho (acertos, erros, percentual) com código de cor: verde ≥75%, amarelo ≥50%, vermelho <50% |
| RF02.5 | O usuário deve poder selecionar a banca examinadora a partir de lista configurável |
| RF02.6 | Quando houver erros, o usuário deve poder classificar a causa do erro: "Não sabia", "Distração", "Pegadinha" ou "Tempo" |
| RF02.7 | O sistema deve salvar a sessão com atualização otimista na store local, com rollback via toast em caso de erro no Supabase |
| RF02.8 | O formulário deve ser resetado após o registro bem-sucedido com confirmação visual |

---

## RF03 — Dashboard

### RF03.1 — Modo Operação

| ID | Requisito |
|---|---|
| RF03.1.1 | O usuário deve poder iniciar uma "operação diária" com nome e meta de questões |
| RF03.1.2 | A operação ativa deve exibir: nome, contagem regressiva até fim do dia (atualizada a cada segundo), barra de progresso com marcadores em 25/50/75% e questões feitas vs meta |
| RF03.1.3 | O estado da operação deve ser persistido no `localStorage` com chave baseada na data atual, expirando automaticamente à meia-noite |
| RF03.1.4 | A operação concluída deve exibir estado visual distinto ("Mission Accomplished" com cor verde) |
| RF03.1.5 | O usuário deve poder abortar uma operação ativa |

### RF03.2 — Dica Diária

| ID | Requisito |
|---|---|
| RF03.2.1 | O sistema deve exibir uma dica motivacional rotativa, alternando por dia a partir de um conjunto fixo de 6 dicas |

### RF03.3 — Meta Global (GoalCard)

| ID | Requisito |
|---|---|
| RF03.3.1 | O sistema deve exibir o total de questões respondidas (all-time) em destaque |
| RF03.3.2 | O sistema deve exibir barra de progresso em direção à meta configurável `big_goal` (padrão: 1000) com marcos em 100, 250, 500, 750 e 1000 questões |
| RF03.3.3 | O sistema deve calcular e exibir o ritmo diário necessário para atingir a meta até o final do ano |

### RF03.4 — Sistema de Patentes (RankBadge)

| ID | Requisito |
|---|---|
| RF03.4.1 | O sistema deve classificar o usuário em 8 patentes militares: RECRUTA, CABO, SARGENTO, TENENTE, CAPITÃO, MAJOR, CORONEL, GENERAL |
| RF03.4.2 | A patente deve ser determinada pelo percentual de progresso em relação à `big_goal` com limiares definidos |
| RF03.4.3 | Cada patente deve exibir nome, símbolo de insígnia, cor e texto descritivo |
| RF03.4.4 | O sistema deve exibir o progresso percentual dentro da patente atual em direção à próxima |

### RF03.5 — Cards de Estatísticas

| ID | Requisito |
|---|---|
| RF03.5.1 | O sistema deve exibir streak (dias consecutivos de estudo) e recorde de melhor streak |
| RF03.5.2 | O sistema deve exibir total de erros absolutos e taxa de erros percentual |
| RF03.5.3 | O sistema deve exibir total de questões nos últimos 7 dias |
| RF03.5.4 | O sistema deve exibir total de questões no mês calendário atual |

### RF03.6 — Painel de KPIs por Matéria

| ID | Requisito |
|---|---|
| RF03.6.1 | O sistema deve exibir cards de acurácia por matéria para todas as matérias estudadas |
| RF03.6.2 | Cada card deve mostrar: nome da matéria, disciplina, acurácia %, barra de progresso com marcador na meta editável (padrão: 75%) |
| RF03.6.3 | O sistema deve exibir badge de tendência (↑/↓) comparando com a sessão mais recente da matéria |
| RF03.6.4 | O sistema deve exibir ícone de medalha para matérias que conquistaram medalha |
| RF03.6.5 | O sistema deve exibir contagem de matérias abaixo da meta |
| RF03.6.6 | O usuário deve poder recolher/expandir o painel, exibindo apenas as 6 matérias com maior volume por padrão |

### RF03.7 — Mapa de Batalha (BattleMap)

| ID | Requisito |
|---|---|
| RF03.7.1 | O sistema deve exibir um mapa visual estilo treemap com disciplinas como zonas e matérias como blocos coloridos |
| RF03.7.2 | O tamanho de cada bloco deve ser proporcional à raiz quadrada do volume de questões |
| RF03.7.3 | A cor dos blocos deve representar status: verde (consolidado, >70%), âmbar (instável, 50–70%), vermelho (sob pressão, <50%) |
| RF03.7.4 | O hover sobre um bloco deve exibir tooltip com nome, status, acurácia e questões respondidas |
| RF03.7.5 | Disciplinas com zonas sob pressão devem ser listadas primeiro |
| RF03.7.6 | O cabeçalho deve exibir contagem de zonas sob pressão e consolidadas |

### RF03.8 — Alerta de Vulnerabilidade

| ID | Requisito |
|---|---|
| RF03.8.1 | O sistema deve listar matérias que ativem condições de vulnerabilidade: baixa acurácia (abaixo do limiar configurável, padrão 50%) e/ou inatividade (sem sessão por dias configurável, padrão 7 dias) |
| RF03.8.2 | Matérias com ambas as condições ativas devem ser destacadas com destaque especial |
| RF03.8.3 | O usuário deve poder configurar os limiares de acurácia e dias de inatividade inline |
| RF03.8.4 | A lista deve ser recolhível, exibindo 5 itens por padrão com expansão para todos |

### RF03.9 — Anel Diário

| ID | Requisito |
|---|---|
| RF03.9.1 | O sistema deve exibir um anel de progresso circular para questões do dia em relação à meta diária configurável |

### RF03.10 — Gráfico de Barras Diário

| ID | Requisito |
|---|---|
| RF03.10.1 | O sistema deve exibir gráfico de barras com questões por dia dos últimos 14 dias |

### RF03.11 — Heatmap de Atividade

| ID | Requisito |
|---|---|
| RF03.11.1 | O sistema deve exibir um heatmap estilo GitHub cobrindo os últimos 365 dias |
| RF03.11.2 | O sistema deve usar 5 níveis de intensidade (0 questões = cinza, até ≥40 = verde intenso) |
| RF03.11.3 | Dias de elite (≥80% de acurácia E ≥10 questões) devem ser exibidos em dourado com borda distinta |
| RF03.11.4 | O tooltip ao passar o mouse deve exibir data, quantidade e marcador de elite |

### RF03.12 — Top Matérias

| ID | Requisito |
|---|---|
| RF03.12.1 | O sistema deve exibir lista das matérias com melhor desempenho por volume de questões ou acurácia |

### RF03.13 — Gráfico por Disciplina

| ID | Requisito |
|---|---|
| RF03.13.1 | O sistema deve exibir barras horizontais com volume de questões por disciplina (top 8) com percentual do total |

### RF03.14 — Painel de Bancas

| ID | Requisito |
|---|---|
| RF03.14.1 | O sistema deve exibir cards de sumário: melhor banca, banca mais difícil, banca mais estudada |
| RF03.14.2 | O sistema deve exibir breakdown por banca: acurácia, acertos vs erros, volume |
| RF03.14.3 | O sistema deve identificar e exibir a matéria mais fraca por banca (mínimo 3 questões, excluindo fontes não-oficiais) |
| RF03.14.4 | O sistema deve calcular e exibir score de diversificação de bancas (índice de Herfindahl invertido, 0–100) com filtro por 7d / 30d / all time |
| RF03.14.5 | O sistema deve exibir análise de tendência: N sessões recentes vs histórico por banca (N configurável: 5, 10, 15) |
| RF03.14.6 | O sistema deve exibir breakdown de causas de erro (Não sabia / Distração / Pegadinha / Tempo) com texto de insight acionável |

### RF03.15 — Galeria de Conquistas

| ID | Requisito |
|---|---|
| RF03.15.1 | O sistema deve avaliar 38 conquistas globais distribuídas em 7 categorias (Volume de Combate, Precisão, Sequência, Sessões, Frentes, Ofensiva Diária, Força de Elite) |
| RF03.15.2 | Cada conquista deve ter 4 níveis de raridade: Comum, Raro, Épico, Lendário |
| RF03.15.3 | Conquistas travadas devem exibir barra de progresso indicando o avanço atual |
| RF03.15.4 | O usuário deve poder filtrar por categoria e alternar para exibir apenas conquistas desbloqueadas |
| RF03.15.5 | O sistema deve exibir progressão de conquistas por disciplina: tier de volume, tier de precisão (com mínimo de questões) e tier de sessões |
| RF03.15.6 | O sistema deve avaliar 3 tiers de medalhas por matéria: Menção Honrosa (≥70% + ≥15q), Medalha de Mérito (≥80% + ≥25q), Cruz de Guerra (≥90% + ≥40q) |
| RF03.15.7 | O sistema deve exibir seção de Força de Elite com: total de dias elite, streak elite atual, melhor acurácia em dia elite, e grid dos 40 dias elite mais recentes |
| RF03.15.8 | Os limiares de dia elite devem ser configuráveis (padrão: ≥80% acurácia E ≥10 questões no dia) |

---

## RF04 — Análise de Evolução

| ID | Requisito |
|---|---|
| RF04.1 | O usuário deve poder selecionar uma matéria via botões (pill buttons) ordenados por volume de questões |
| RF04.2 | O sistema deve exibir gráfico de linha com acurácia (%) ao longo do tempo, um ponto por data, com linha de referência em 75% |
| RF04.3 | Os pontos do gráfico devem ser coloridos por tier: verde/âmbar/vermelho |
| RF04.4 | O sistema deve exibir stats acima do gráfico: última sessão, média geral, evolução total (primeiro vs último) e total de questões |
| RF04.5 | O sistema deve exibir tabela rolável abaixo do gráfico: data, acertos, erros, acurácia — ordenada da mais recente para a mais antiga |

---

## RF05 — Histórico de Sessões

| ID | Requisito |
|---|---|
| RF05.1 | O sistema deve exibir sumário: total de sessões, sessões da extensão QConcursos, sessões do dia |
| RF05.2 | O usuário deve poder filtrar sessões por: Todas / QConcursos / Manual |
| RF05.3 | O usuário deve poder buscar sessões por texto livre (disciplina, matéria, banca) |
| RF05.4 | A tabela de sessões deve ser ordenável por: data, disciplina, matéria, banca, acurácia, origem |
| RF05.5 | O sistema deve exibir badges de origem: "QC" (extensão), "FC" (flashcard), "manual" |
| RF05.6 | O usuário deve poder editar uma sessão existente via modal inline (data, disciplina, matéria, banca, acertos, total) com preview de acurácia |
| RF05.7 | O usuário deve poder excluir uma sessão com modal de confirmação |
| RF05.8 | Atualizações e exclusões devem usar atualização otimista com rollback em caso de erro |

---

## RF06 — Flashcards

### RF06.1 — Criação

| ID | Requisito |
|---|---|
| RF06.1.1 | O usuário deve poder criar flashcards selecionando disciplina, matéria e banca |
| RF06.1.2 | O usuário deve informar a frente (pergunta) e o verso (resposta) como texto livre |
| RF06.1.3 | O flashcard deve ser salvo com metadados de SRS inicializados vazios |

### RF06.2 — Revisão (SRS)

| ID | Requisito |
|---|---|
| RF06.2.1 | O sistema deve exibir abas de disciplinas com contagem de cards vencidos por disciplina |
| RF06.2.2 | A fila de revisão deve ser composta por todos os cards com `nextDue <= now` ou nunca revisados |
| RF06.2.3 | O card deve ser virado com animação CSS 3D ao clicar para revelar a resposta |
| RF06.2.4 | Após a virada, o usuário deve poder avaliar o card em 3 níveis: Difícil (1), Normal (2), Fácil (3) |
| RF06.2.5 | O algoritmo SRS deve calcular o próximo intervalo de revisão com base na avaliação e contagem de revisões anteriores (intervalos base: 1/3/7 dias × fator de crescimento) |
| RF06.2.6 | O sistema deve exibir barra de progresso da sessão de revisão |
| RF06.2.7 | Ao concluir todos os cards, o sistema deve exibir sumário da sessão com opção de rever os cards difíceis |
| RF06.2.8 | A primeira revisão de um card deve gerar um registro de sessão (source: 'flashcard') para fins de estatísticas |

### RF06.3 — Banco de Flashcards

| ID | Requisito |
|---|---|
| RF06.3.1 | O usuário deve poder visualizar todos os flashcards com filtro por disciplina e busca por texto (pergunta, resposta, matéria) |
| RF06.3.2 | O sistema deve detectar e sinalizar cards órfãos (cuja disciplina/matéria não existe mais na lista ativa) |
| RF06.3.3 | O usuário deve poder reclassificar em lote todos os cards de um grupo inválido para nova disciplina/matéria, ou excluí-los em lote |
| RF06.3.4 | Cada card deve poder ser expandido para exibir: resposta, data da última revisão, próxima data de revisão, histórico de revisões e opções de edição/exclusão |
| RF06.3.5 | Cada card deve exibir: badge de acurácia (% de avaliações ≥2), contagem de revisões e indicador de status (vencido/em dia) |

---

## RF07 — Gerenciamento de Matérias

| ID | Requisito |
|---|---|
| RF07.1 | O usuário deve poder adicionar e remover disciplinas |
| RF07.2 | O usuário deve poder adicionar e remover matérias dentro de uma disciplina via input inline |
| RF07.3 | A remoção de uma disciplina deve excluir a disciplina e todas as suas matérias |
| RF07.4 | Todas as alterações devem ser persistidas via API backend com atualização otimista e rollback em falha |
| RF07.5 | O sistema deve exibir sumário: total de disciplinas e total de matérias |

---

## RF08 — Sistema de Personagem / RPG

| ID | Requisito |
|---|---|
| RF08.1 | O sistema deve exibir avatar com emoji baseado em nível, nível (1–10) com título e barra de XP para o próximo nível |
| RF08.2 | Os limiares de XP devem ser: 0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000 |
| RF08.3 | O sistema deve exibir 4 mini-stats: Total de Questões, Acurácia %, Streak atual e Melhor streak |
| RF08.4 | O sistema deve exibir lista de conquistas definidas no backend: rótulo, descrição, estado (desbloqueado/travado) e data de desbloqueio |
| RF08.5 | O sistema deve renderizar a árvore de habilidades com nós conectados por arestas bezier em SVG |
| RF08.6 | A posição dos nós deve ser calculada automaticamente pelo algoritmo `placeNode` |
| RF08.7 | Arestas ativas (nós estudados) devem ser exibidas em roxo; inativas em escuro; travadas em tracejado |
| RF08.8 | Um nó deve ser bloqueado se seu nó pai tiver 0 sessões registradas |
| RF08.9 | Cada nó da árvore deve exibir: rótulo, contagem de sessões, acurácia %, barra de progresso; nós bloqueados em cinza |

---

## RF09 — Relatórios

### RF09.1 — Relatório Semanal

| ID | Requisito |
|---|---|
| RF09.1.1 | O relatório deve cobrir a semana atual (últimos 7 dias) vs semana anterior (7 dias anteriores) |
| RF09.1.2 | O sistema deve exibir KPIs com deltas semana a semana: Questões, Acurácia Média (destacada se ≥80%), Sessões, Dias de Elite |
| RF09.1.3 | O sistema deve exibir strip de meta diária (visualização de 7 dias) com cor por atingimento de meta e status elite |
| RF09.1.4 | O sistema deve listar frentes recuperadas (matérias com melhora ≥3pp vs semana anterior, mínimo 3 sessões em ambas as semanas) |
| RF09.1.5 | O sistema deve listar frentes em declínio (matérias com queda ≥3pp) |
| RF09.1.6 | O sistema deve exibir Top 3 e Bottom 3 performers (matérias com ≥5 questões na semana) |
| RF09.1.7 | O sistema deve exibir tabela por disciplina: barra de volume e acurácia da semana |

### RF09.2 — Relatório de Questões e Flashcards

| ID | Requisito |
|---|---|
| RF09.2.1 | O sistema deve exibir tabela unificada de todos os flashcards e sessões não-flashcard |
| RF09.2.2 | O sistema deve exibir 5 KPIs totais: Total de itens, Sem revisão, Acertos, Erros, Acurácia % |
| RF09.2.3 | O usuário deve poder filtrar por disciplina, buscar por texto e ordenar por: data de criação, mais erros, menor acurácia, maior acurácia, mais revisado |
| RF09.2.4 | Linhas de flashcard devem ser expansíveis para exibir Q&A completo e histórico de revisões |
| RF09.2.5 | O usuário deve poder exportar os dados filtrados como arquivo CSV (UTF-8 BOM) |

---

## RF10 — Diário de Operações

| ID | Requisito |
|---|---|
| RF10.1 | O usuário deve poder registrar um diário diário com 3 campos: o que estudou, o que encontrou dificuldade, e o que precisa reforçar |
| RF10.2 | Deve ser permitido apenas um registro por dia (upsert por user_id + data) |
| RF10.3 | O registro do dia atual deve ser exibido no topo, com opção de edição inline |
| RF10.4 | O sistema deve exibir contador de streak de dias consecutivos com registro |
| RF10.5 | O usuário deve poder buscar no histórico do diário por texto livre nos 3 campos |
| RF10.6 | Registros passados devem ser expansíveis/recolhíveis com preview dos 3 campos |

---

## RF11 — Caderno de Notas

| ID | Requisito |
|---|---|
| RF11.1 | O sistema deve exibir painel lateral com: contagem de notas, busca e notas agrupadas por disciplina |
| RF11.2 | Cada item da lista deve exibir: título, tempo relativo de modificação, tag de matéria e preview de 80 caracteres (sem HTML) |
| RF11.3 | O editor de notas deve suportar: negrito, itálico, sublinhado, tachado, H1/H2/H3, listas (com marcador e numerada), citação em bloco, régua horizontal |
| RF11.4 | O editor deve suportar paleta de cores de texto (7 cores predefinidas) e paleta de cores de destaque (6 cores) |
| RF11.5 | O editor deve incluir paleta de símbolos matemáticos/lógicos com ~60 símbolos em 4 categorias (Lógica Proposicional, Conjuntos, Matemática, Letras Gregas) |
| RF11.6 | O editor deve suportar desfazer/refazer |
| RF11.7 | O sistema deve auto-salvar a nota com debounce de 1,4 segundos após qualquer alteração, exibindo indicador de status (salvo/não salvo/salvando) |
| RF11.8 | O sistema deve exibir contagem de palavras no rodapé do editor |
| RF11.9 | O usuário deve poder excluir uma nota com confirmação em dois passos |
| RF11.10 | O usuário deve poder atribuir disciplina e matéria a uma nota a partir da lista de disciplinas do usuário |

---

## RF12 — Sincronização com Extensão (QConcursos)

| ID | Requisito |
|---|---|
| RF12.1 | O sistema deve escutar em tempo real eventos de `INSERT` nas tabelas `sessions` e `flashcards` via Supabase Realtime (canal `extension-sync`, filtrado por `user_id`) |
| RF12.2 | Novas sessões recebidas via extensão devem disparar toast de notificação ("Disc › Matéria — registrado via QConcursos") e atualizar os dados do personagem |
| RF12.3 | Quando a aba recuperar o foco (após estar oculta), o sistema deve buscar sessões com `source='QConcursos'` criadas desde a última sincronização |
| RF12.4 | Ambas as estratégias de sincronização devem deduplicar por ID antes de atualizar a store |

---

## RF13 — Configuração do Usuário

| ID | Requisito |
|---|---|
| RF13.1 | O sistema deve permitir configurar meta diária de questões (padrão: 30) |
| RF13.2 | O sistema deve permitir configurar meta global de questões — `big_goal` (padrão: 1000) |
| RF13.3 | O sistema deve permitir configurar meta semanal de questões (padrão: 200) |
| RF13.4 | O sistema deve permitir configurar meta mensal de questões (padrão: 500) |
| RF13.5 | As configurações devem ser persistidas via upsert na tabela `user_config` do Supabase |

---

## RF14 — Onboarding

| ID | Requisito |
|---|---|
| RF14.1 | No primeiro login, se não existir `user_config`, o sistema deve chamar `POST /v1/onboarding` no backend para semear dados iniciais |
| RF14.2 | Após o onboarding, o sistema deve recarregar configurações, bancas e disciplinas |

---

## RF15 — Sistema de Notificações (Toast)

| ID | Requisito |
|---|---|
| RF15.1 | O sistema deve exibir notificações toast globais com 3 tipos: erro, sucesso, informação |
| RF15.2 | As notificações devem ser dispensadas automaticamente após 4,5 segundos |

---

## Modelos de Dados

| Entidade | Campos Principais |
|---|---|
| `Session` | id, user_id, ts, date, disc, mat, total, correct, banca, source (manual/QConcursos/flashcard), error_type |
| `SessionStat` | id, date, total, correct, disc, mat |
| `Flashcard` | id, user_id, ts, disc, mat, q, a, banca, reviews[] |
| `FlashcardReview` | ts, rating (1/2/3), nextDue |
| `UserConfig` | user_id, daily, big_goal, weekly, monthly |
| `DiaryEntry` | id, user_id, date, atacou, resistiu, reforco, created_at, updated_at |
| `Note` | id, user_id, title, content (HTML), disc, mat, created_at, updated_at |
| `CharacterData` | user_id, xp, level, level_title, level_emoji, xp_next_level, stats{}, achievements[] |
| `TNode` | id, label, disc?, mat?, icon?, children? |

---

## API Backend (Go — `localhost:8080`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/v1/disciplines` | Busca mapa de disciplinas/matérias do usuário |
| PUT | `/v1/disciplines` | Salva mapa de disciplinas/matérias atualizado |
| GET | `/v1/skill-tree` | Busca hierarquia de nós da árvore de habilidades |
| GET | `/v1/character` | Busca XP, nível, stats e conquistas do personagem |
| POST | `/v1/onboarding` | Semeada de dados iniciais no primeiro login |

---

## RF16 — Duelo de Fantasmas

Exibe, no gráfico de evolução por matéria (RF04), uma linha fantasma cinza representando a melhor semana histórica do usuário naquela matéria, sobreposta à semana atual. O objetivo é criar o desejo de superar o próprio eu do passado.

| ID | Requisito |
|---|---|
| RF16.1 | O sistema deve identificar a "melhor semana histórica" de uma matéria como a semana (seg–dom) fora da semana atual com maior total de questões respondidas nessa matéria |
| RF16.2 | O sistema deve plotar uma linha fantasma (cinza claro, tracejada) no gráfico de evolução representando a acurácia de cada sessão da melhor semana histórica, alinhada por dia da semana à semana atual |
| RF16.3 | A linha fantasma deve aparecer apenas nas posições do eixo X correspondentes à semana atual; posições de outras semanas devem ser nulas (sem ponto desenhado) |
| RF16.4 | O sistema deve exibir um card "Duelo de Fantasmas" entre os mini-stats e o gráfico, contendo: data da melhor semana (formato DD/MM – DD/MM/YYYY), total de questões do fantasma, acurácia média do fantasma, total de questões da semana atual e acurácia média da semana atual |
| RF16.5 | O status do duelo deve ser calculado com base em ritmo (pace): o fantasma é projetado proporcionalmente aos dias já decorridos da semana atual (ex: na quarta-feira, o alvo é 4/7 do total do fantasma) |
| RF16.6 | O card deve exibir um badge de status: "Iniciar" (semana atual sem sessões), "Vencendo" (no ritmo ou à frente do fantasma) ou "Faltam Xq" (quantidade de questões necessárias para alcançar o ritmo do fantasma) |
| RF16.7 | Quando o status for "Vencendo", o card deve ter destaque visual em verde; nos demais estados, visual neutro |
| RF16.8 | O gráfico deve exibir uma legenda inline indicando que a linha cinza tracejada representa o fantasma, diferenciando da linha tracejada escura da meta de 75% |
| RF16.9 | O Duelo de Fantasmas deve aparecer apenas se existir pelo menos uma semana histórica completa anterior à semana atual com sessões dessa matéria; caso contrário, o card e a linha fantasma não são exibidos |

---

## RF17 — Sistema de Moral do Operador (Barra de Stamina)

Barra de "Moral" de 0–100 que sobe ao cumprir a meta diária e cai drasticamente ao falhar. Se a moral chegar a zero, o usuário perde a patente atual temporariamente (rebaixamento simbólico). Objetivo: punir a inconsistência e recompensar a regularidade acima da intensidade.

| ID | Requisito |
|---|---|
| RF17.1 | O sistema deve calcular um score de Moral (0–100) baseado nos últimos 13 dias completos de estudo, iniciando em 70 (neutro) |
| RF17.2 | Para cada dia completo no histórico: dia com questões ≥ meta diária → +10 pts (máx 100); dia com questões > 0 mas < meta → −5 pts; dia com 0 questões → −20 pts |
| RF17.3 | Dias anteriores à primeira sessão registrada do usuário não devem ser contados como falta (evitar penalização de novos usuários) |
| RF17.4 | O dia atual deve contribuir com +10 pts se a meta já foi cumprida, sem penalidade se ainda não foi cumprida |
| RF17.5 | O sistema deve exibir o score como barra de HP segmentada em 10 blocos, com cor dinâmica: verde (80–100 "Operacional"), verde-amarelo (60–79 "Regular"), âmbar (40–59 "Instável"), laranja (20–39 "Crítico"), vermelho (1–19 "Colapso Iminente"), vermelho escuro (0 "REBAIXADO") |
| RF17.6 | O sistema deve exibir um mini-histórico dos últimos 13 dias + hoje como 14 barras coloridas: verde = cumpriu, âmbar = parcial, cinza escuro = falta, transparente = anterior à primeira sessão |
| RF17.7 | O sistema deve exibir o status do dia atual: "✓ Meta cumprida", "⏳ X/Yq" (em progresso) ou "— Nenhuma questão hoje ainda" |
| RF17.8 | O sistema deve exibir um contador de dias consecutivos com meta cumprida (contando de hoje para trás) |
| RF17.9 | Quando moral = 0, o sistema deve exibir um aviso de "Rebaixamento Ativo" informando a patente atual e a patente reduzida (uma abaixo da atual na hierarquia de 8 patentes) |
| RF17.10 | Quando moral = 0 e o usuário já está em RECRUTA (patente mínima), o aviso deve indicar "Patente RECRUTA ameaçada" |
| RF17.11 | O GoalCard deve exibir um badge pulsante "▼ Rebaixado" ao lado da patente atual quando moral = 0 |
| RF17.12 | O rebaixamento é exclusivamente simbólico e visual — nenhum dado real é alterado. A patente real, calculada por RF03.4, permanece inalterada e é restaurada automaticamente quando a moral supera 0 |
| RF17.13 | O painel "Moral do Operador" deve ser posicionado no Dashboard imediatamente abaixo do GoalCard e acima dos stat cards |

---

## Análise: Requisitos que Sustentam a Motivação do Usuário

A motivação para estudar de forma contínua depende de múltiplos mecanismos psicológicos. O quadro abaixo mapeia os requisitos existentes por mecanismo motivacional, explicando por que cada um contribui para manter o usuário engajado.

---

### 1. Gamificação — Recompensa e Progressão

Requisitos que criam laços de recompensa e senso de progressão, tornando o esforço visível como avanço em um sistema de status.

| Requisito(s) | Mecanismo |
|---|---|
| RF03.4.1–4 — Sistema de Patentes | Progressão de status com 8 níveis (RECRUTA → GENERAL). A patente atual cria uma identidade e a próxima cria um objetivo imediato. |
| RF08.1–2 — Personagem / XP e Nível | Sistema RPG clássico: cada questão respondida gera XP. O nível sobe visualmente, reforçando que o esforço acumula. |
| RF03.15.1–4 — 38 Conquistas globais com raridade | Variedade de objetivos em 7 categorias e 4 raridades (Comum → Lendário) mantém múltiplos "próximos objetivos" simultaneamente, evitando estagnação. |
| RF03.15.5 — Conquistas por disciplina | Recompensa granular: mesmo uma disciplina nova gera tiers de progresso, incentivando a diversificação do estudo. |
| RF03.15.6 — Medalhas por matéria (3 tiers) | Reconhecimento de maestria por matéria. A Cruz de Guerra (≥90% + ≥40q) é difícil o suficiente para ser aspiracional. |
| RF08.4 — Conquistas definidas no backend | Surpresa e descoberta: o usuário não conhece todas as conquistas de antemão, criando momento de revelação ao desbloquear. |

---

### 2. Visibilidade de Metas e Progresso

Requisitos que tornam o progresso explícito e mensurável. A motivação cai quando o esforço parece invisível; esses requisitos evitam isso.

| Requisito(s) | Mecanismo |
|---|---|
| RF03.3.1–3 — Meta Global (GoalCard) | Âncora de longo prazo: o total all-time, os marcos (100, 250, 500…) e o ritmo diário necessário transformam uma meta abstrata em plano concreto. |
| RF03.9.1 — Anel Diário | Feedback de curto prazo (hoje). O fechamento do anel diário gera satisfação imediata e encerramento cognitivo. |
| RF03.5.3–4 — Questões na semana e no mês | Acumuladores de médio prazo que mostram que dias pequenos se somam. Reduzem a sensação de que "não estudei nada essa semana". |
| RF13.1–4 — Configuração de metas | Ownership: metas que o próprio usuário define geram maior comprometimento do que metas impostas. |
| RF03.6.2 — KPI por matéria com meta editável | Clareza sobre o alvo por matéria. O marcador visual na barra de progresso torna a meta local concreta. |

---

### 3. Mecanismos de Consistência (Streak e Hábito)

Requisitos que exploram a aversão à perda e o efeito de identidade ("sou alguém que estuda todo dia").

| Requisito(s) | Mecanismo |
|---|---|
| RF03.5.1 — Streak de dias consecutivos + recorde | Aversão à perda: quebrar o streak dói mais do que ganhar um novo dia motiva. O recorde cria um alvo para superar. |
| RF03.11.1–3 — Heatmap de 365 dias | Visualização de consistência ao longo do ano. Deixar um "buraco" no heatmap cria desconforto — o mesmo efeito que motiva contribuições no GitHub. Dias de elite em dourado criam aspiração. |
| RF10.4 — Streak do Diário de Operações | Segundo contador de consistência independente do volume de questões: reforça o hábito de reflexão diária mesmo em dias de menor estudo. |
| RF03.15.7 — Streak de dias de elite | Streak de qualidade, não apenas de presença. Incentiva sesões de alto desempenho e não apenas "marcar presença". |

---

### 4. Urgência e Foco Diário

Requisitos que criam pressão de tempo benéfica — estruturam o dia e evitam a procrastinação.

| Requisito(s) | Mecanismo |
|---|---|
| RF03.1.1–4 — Modo Operação com contagem regressiva | A contagem regressiva até o fim do dia transforma a meta em missão com prazo. A conclusão exibe "Mission Accomplished", gerando fechamento emocional. |
| RF03.2.1 — Dica motivacional diária | Micro-engajamento: mesmo sem abrir outra seção, a dica do dia injeta um estímulo breve. Alterna por dia para evitar desgaste. |

---

### 5. Punição à Inconsistência (Risco de Perda)

Requisitos que criam consequências negativas concretas para a falta de regularidade — não apenas ausência de recompensa, mas penalidade visível. A assimetria entre ganho (+10 por dia bom) e perda (−20 por dia zerado) torna a consistência a estratégia dominante.

| Requisito(s) | Mecanismo |
|---|---|
| RF17.1–8 — Barra de Moral | A barra HP desce drasticamente ao falhar (−20) vs sobe devagar ao cumprir (+10). Esse desequilíbrio intencional torna cada dia zerado doloroso, sem que a barra possa ser recuperada com um único "dia épico". A regularidade é a única estratégia vencedora. |
| RF17.9–12 — Rebaixamento simbólico | Perder a patente é a punição mais visível do sistema. O badge "▼ Rebaixado" aparece no GoalCard — área de maior destaque da tela — criando uma "vergonha produtiva" que motiva a retomada imediata. |

---

### 6. Competição Consigo Mesmo

Requisitos que criam rivalidade interna — o usuário compete contra uma versão anterior de si mesmo, não contra métricas abstratas. É o mecanismo motivacional mais personalizado do sistema: o inimigo é familiar, real e derrotável.

| Requisito(s) | Mecanismo |
|---|---|
| RF16.1–9 — Duelo de Fantasmas | A melhor semana histórica da matéria vira um "oponente" visível no gráfico. A linha cinza fantasma, alinhada à semana atual, materializa o passado como algo a ser superado. O badge "Faltam Xq" converte a lacuna em ação concreta e imediata. O cálculo por ritmo (pace) mantém o duelo justo a qualquer momento da semana — nem impossível na segunda, nem trivial no domingo. |

---

### 6. Diagnóstico e Direcionamento da Ação

Requisitos que convertem dados em ação concreta. A motivação cai quando o usuário não sabe o que fazer a seguir.

| Requisito(s) | Mecanismo |
|---|---|
| RF03.8.1–3 — Alerta de Vulnerabilidade | Remove a paralisia de escolha: o sistema aponta explicitamente onde estudar, reduzindo a carga cognitiva de planejar. |
| RF03.7.1–6 — Mapa de Batalha | Visão espacial das lacunas: blocos vermelhos são urgentes, verdes são conquistas visíveis. Cria sensação de território a ser "conquistado". |
| RF03.6.3 — Badge de tendência (↑/↓) | Feedback imediato de evolução por matéria — o usuário sabe se está melhorando ou piorando sem precisar ir à tela de análise. |
| RF04.1–5 — Gráfico de evolução por matéria | Evidência de progresso real ao longo do tempo. Ver a curva subindo é um dos motivadores mais poderosos para continuar. |
| RF03.14.6 — Breakdown de causas de erro | Transforma erro em dado acionável: "Distração" sugere ambiente, "Não sabia" sugere revisão de conteúdo. Reduz frustração e direciona esforço. |
| RF09.1.4–5 — Frentes recuperadas e em declínio | Linguagem de batalha: "recuperar frentes" enquadra o progresso como vitória, e "frentes em declínio" cria urgência sem culpa. |

---

### 6. Identidade e Narrativa Militar

Requisitos que criam uma identidade coerente para o estudo. A motivação sustentada depende do usuário se ver como alguém que estuda — não apenas alguém que tenta.

| Requisito(s) | Mecanismo |
|---|---|
| RF03.4.1–4 — Patentes militares | A linguagem (RECRUTA → GENERAL) posiciona o estudo como carreira militar: há hierarquia, há promoção, há mérito. |
| RF03.1.1 — "Operação diária" | Nomear a sessão de estudo como operação cria senso de missão. Missões têm começo, meio e fim — ao contrário de "estudar". |
| RF03.7 — Mapa de Batalha | O vocabulário "frentes", "zonas sob pressão", "consolidado" reforça a metáfora: o estudo é uma campanha, não uma tarefa. |
| RF03.15.7 — Seção Força de Elite | Pertencer à "elite" (dias com ≥80% + ≥10 questões) cria uma categoria identitária aspiracional. O grid de dias elite é um troféu visual. |
| RF08.8–9 — Árvore de habilidades com nós bloqueados | A árvore visível mas bloqueada cria tensão motivacional positiva: "preciso desbloquear isso". A progressão é tangível e espacial. |

---

### 7. Reflexão e Autoconsciência

Requisitos que promovem metacognição — o usuário não apenas estuda, ele entende como estuda.

| Requisito(s) | Mecanismo |
|---|---|
| RF10.1–6 — Diário de Operações | Reflexão estruturada diária em 3 dimensões (o que atacou, o que resistiu, o que precisa reforçar) aumenta a consciência sobre pontos cegos e consolida o aprendizado. |
| RF09.1.1–7 — Relatório Semanal | Balanço semanal com comparativo: ver a evolução em 7 dias reduz a sensação de estagnação que ocorre quando se avalia apenas o dia atual. |
| RF04.4 — Evolução total (primeiro vs último) | Mostrar a diferença entre a primeira e a última sessão de uma matéria evidencia crescimento real — especialmente útil quando o usuário sente que "não está evoluindo". |

---

### Resumo por Intensidade Motivacional

| Mecanismo | Impacto | Requisitos-chave |
|---|---|---|
| Consistência / Streak | Alto — aversão à perda é um dos motivadores mais fortes | RF03.5.1, RF03.11, RF10.4, RF03.15.7 |
| Urgência e foco diário | Alto — combate procrastinação diretamente | RF03.1, RF03.9 |
| Progressão de status (gamificação) | Alto — recompensas frequentes e de longo prazo em paralelo | RF03.4, RF08.1–2, RF03.15 |
| Punição à inconsistência (risco de perda) | Alto — assimetria de ganho/perda torna regularidade a única estratégia | RF17 |
| Competição consigo mesmo | Alto — rivalidade personalizada, inimigo familiar e derrotável | RF16 |
| Diagnóstico e direcionamento | Médio-alto — elimina paralisia, converte dado em ação | RF03.8, RF04, RF03.14.6 |
| Identidade e narrativa | Médio — sustenta motivação intrínseca de longo prazo | RF03.7, RF08, RF03.15.7 |
| Visibilidade de metas | Médio — necessário mas insuficiente sozinho | RF03.3, RF13 |
| Reflexão | Médio — efeito indireto via metacognição | RF10, RF09.1 |

---

## Funcionalidade em Migração (Não Funcional)

| Rota | Status |
|---|---|
| `/verbos` | Placeholder "em migração". Tipos `VerbConjugation` e `VerbSession` existem no sistema de tipos e na store, mas a rota não renderiza conteúdo funcional. A funcionalidade prevista é prática de conjugação verbal. |
