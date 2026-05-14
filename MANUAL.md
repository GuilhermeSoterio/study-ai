# New Age — Manual do Sistema

**New Age** é uma plataforma gamificada de preparação para concursos públicos. O sistema transforma o estudo em uma jornada épica, com patentes, mapas de batalha, conquistas e análises detalhadas de desempenho.

---

## Sumário

1. [Navegação](#navegação)
2. [Dashboard](#dashboard)
3. [Registrar Sessão](#registrar-sessão)
4. [Análise](#análise)
5. [Histórico](#histórico)
6. [Diário de Guerra](#diário-de-guerra)
7. [Flashcards](#flashcards)
8. [Relatório](#relatório)
9. [Sistema de Patentes](#sistema-de-patentes)
10. [Sistema de Conquistas](#sistema-de-conquistas)
11. [Integração com QConcursos](#integração-com-qconcursos)

---

## Navegação

A tela é dividida em dois elementos laterais fixos:

- **Rail esquerdo (estreito):** ícones de grupos — Painel, Estudo, Performance, Evolução.
- **Menu secundário:** ao clicar em um grupo, expande as páginas disponíveis dentro dele.

| Grupo | Páginas |
|---|---|
| Painel | Dashboard |
| Estudo | Modo Foco, New Age, Diário, Caderno |
| Performance | Análise, Histórico, Relatório |
| Evolução | Flashcards, Matérias, Patentes, Personagem |

---

## Dashboard

**Rota:** Painel → Dashboard

Tela principal do sistema. Oferece uma visão geral completa do progresso com vários painéis organizados em colunas.

---

### Personagem e Patente (coluna esquerda)

Exibe o avatar do personagem, a patente atual, o progresso para a próxima patente e a velocidade de estudo (questões por dia).

- A barra de progresso avança conforme a meta total de questões é cumprida.
- Marcos intermediários (100, 250, 500, 750, 1000 questões) são exibidos na barra.
- Se a moral do personagem colapsar, o status "Rebaixado" é exibido.

---

### Operação do Dia (coluna central)

Sistema de meta diária. Funciona como uma missão com limite de tempo até 23h59.

**Como usar:**
1. Defina quantas questões quer fazer no dia (ex.: 40).
2. Acompanhe a barra de progresso segmentada em tempo real.
3. Ao atingir a meta, aparece a mensagem "Missão Cumprida".

A barra muda de cor conforme o progresso: vermelho → amarelo → verde ao concluir.

---

### Dica do Dia

Exibe uma dica motivacional ou estratégica, rotacionada a cada 24 horas.

---

### Mapa de Batalha (BattleMap)

Visualização estilo **Kintsugi** — a metáfora de transformar ferro em ouro. Cada matéria é um bloco cuja aparência evolui conforme o desempenho.

| Status | Taxa de Acerto | Aparência |
|---|---|---|
| Ferro Bruto | < 50% | Escuro, sem brilho |
| Temperando | 50–70% | Tom intermediário |
| Ouro Forjado | > 70% | Dourado, brilhante |

- O **tamanho** do bloco é proporcional ao volume de questões estudadas.
- O badge **🔥** marca a matéria com maior urgência de revisão.
- O badge **☢** indica matérias elegíveis ao **Protocolo de Limpeza**: ao clicar, é possível registrar revisões que "apagam" erros anteriores e melhoram a taxa efetiva.
- Passe o mouse sobre qualquer bloco para ver detalhes (taxa, total de questões, status).

---

### Alertas de Vulnerabilidade (VulnAlert)

Lista matérias que precisam de atenção imediata. O sistema cruza dois critérios configuráveis:

- **Baixa acurácia:** abaixo de um limiar (padrão: 50%).
- **Inatividade:** não estudada há mais de X dias (padrão: 7).

Matérias que disparam **ambos** os critérios aparecem em destaque com maior prioridade.

---

### Estatísticas Rápidas

Quatro cards com métricas gerais:

| Card | O que mostra |
|---|---|
| 🔥 Streak | Dias consecutivos estudando |
| ❌ Erros | Total de erros e % de erro geral |
| 📅 Semana | Questões feitas nesta semana |
| 📆 Mês | Questões feitas neste mês |

---

### KPI por Matéria (KpiPanel)

Grade de cards com desempenho detalhado por matéria.

- Cada card mostra a taxa de acerto atual vs. a meta definida (padrão: 75%).
- A barra de progresso muda de cor: verde (meta atingida), amarelo (50–70%), vermelho (abaixo de 50%).
- Badge de tendência: **↑** melhoria, **↓** queda, **=** estável.
- Clique em "Meta: X% ✎" para ajustar a meta daquela matéria individualmente.
- Se houver muitas matérias, use "Ver todas" para expandir a lista.

---

### Gráficos Diários

- **Barras:** questões feitas por dia nas últimas 2 semanas.
- **Rosca:** proporção de acertos e erros no dia atual.

---

### Heatmap de Atividade

Grade de 52 semanas mostrando o volume de estudo por dia.

- Cores mais escuras = mais questões no dia.
- Dias com ≥ 75% de acerto e ≥ 10 questões recebem destaque **⭐ Elite**.
- Passe o mouse para ver a data e o total de questões.

---

### Desempenho por Banca (BancaPanel)

Painel completo com análise de desempenho por banca examinadora.

| Seção | O que mostra |
|---|---|
| Resumo | Melhor banca, mais difícil e mais estudada |
| Breakdown | Tabela com volume e acurácia por banca |
| Matéria Fraca | Pior matéria dentro de cada banca |
| Diversificação | Score 0–100 de distribuição entre bancas |
| Tendência | Comparação entre histórico geral e sessões recentes |
| Tipos de Erro | Distribuição entre: não sabia, distração, pegadinha, tempo |

**Score de diversificação:** 70+ = bem diversificado, 40–70 = moderado, < 40 = concentrado demais em poucas bancas.

---

### Galeria de Conquistas (AchievementGallery)

Exibe todas as conquistas disponíveis e o progresso para desbloqueá-las.

- Barra geral mostrando X de Y conquistas desbloqueadas.
- Filtros por categoria: volume, precisão, sequência, sessões, frentes, ofensiva, elite.
- Medalhas conquistadas por matéria individual.
- Seção **Força de Elite**: dias em que a acurácia foi ≥ 80% e o volume ≥ 10 questões.
- Seção **Conquistas por Disciplina**: progresso em volume, precisão e sessões para cada área.

---

## Registrar Sessão

**Rota:** Estudo → New Age (ou botão de registro)

Tela para entrada manual de uma sessão de estudos.

**Campos:**

| Campo | Descrição |
|---|---|
| Disciplina | Área de conhecimento (ex.: Direito Constitucional) |
| Matéria | Subtópico dentro da disciplina |
| Total de questões | Quantas questões foram feitas |
| Acertos | Quantas foram acertadas (validado: não pode ser maior que o total) |
| Banca | Banca examinadora das questões |
| Tipo de erro | Visível somente se houver erros: não sabia, interpretação, distração, pegadinha, tempo |
| Temática | Opcional — tema específico das questões (com autocomplete do histórico) |

**Preview em tempo real:** antes de salvar, o sistema exibe um resumo com acertos, erros e taxa de aproveitamento.

Ao salvar, o formulário reseta e uma confirmação aparece.

---

## Análise

**Rota:** Performance → Análise

Tela de análise detalhada da evolução do desempenho.

---

### Semana Atual vs. Semana Anterior

Comparação lado a lado das duas últimas semanas:
- Total de questões e taxa de acurácia de cada semana.
- Delta (variação) em questões e em pontos percentuais de acurácia.
- Gráfico misto: barras (volume) + linhas (acurácia) com dois eixos Y.

---

### Desempenho por Temática

Tabela com cada tema estudado, mostrando total de questões, número de sessões e taxa de acerto. Ordenado por volume de questões.

---

### Análise por Matéria

Selecione uma matéria via pills para ver:

**Mini estatísticas:**
- Taxa da última sessão
- Média geral
- Evolução total (variação em pp desde o início)
- Total de questões estudadas

**Duelo de Fantasmas:**
Compara a semana atual com a **melhor semana histórica** da matéria (o "fantasma").
- Mostra o período da semana fantasma, total de questões e acurácia média.
- Exibe se você está vencendo ou quantas questões faltam para bater o recorde.

**Gráfico de evolução:**
Linha com pontos mostrando a taxa de acerto ao longo do tempo, com:
- Linha tracejada da meta (75% por padrão).
- Linha tracejada do fantasma (melhor semana), se disponível.

**Tabela de sessões:** lista todas as sessões desta matéria com data, acertos, erros e taxa. Mais recentes primeiro.

---

## Histórico

**Rota:** Performance → Histórico

Registro completo de todas as sessões de estudo.

**Abas:**
- **Sessões:** lista todas as entradas com filtros.
- **Questões:** visualização individual de questões.

**Filtros disponíveis:**
- Tipo: Todas, QConcursos (via extensão), Manual.
- Busca por texto: disciplina, matéria ou tema.

**Ações por sessão (ao passar o mouse):**
- ✎ Editar sessão (abre modal de edição com validação).
- ✕ Remover sessão (abre modal de confirmação antes de deletar).

**Cards de resumo:** exibem total de sessões, sessões feitas hoje e sessões via extensão.

---

## Diário de Guerra

**Rota:** Estudo → Diário

Espaço de reflexão estratégica diária. Preencher o diário mantém a moral do personagem elevada e o streak ativo.

**Três campos de reflexão (máx. 500 caracteres cada):**

| Campo | Propósito |
|---|---|
| ⚔️ O que atacou hoje | Matérias estudadas, questões resolvidas |
| 🛡️ O que resistiu | O que foi difícil, travou ou não fixou |
| 🔧 O que precisa de reforço | O que revisar no próximo dia |

**Funcionalidades:**
- Se já existe uma entrada para hoje, ela é exibida de forma colapsável.
- É possível registrar entradas retroativas (até 1 ano atrás).
- **Streak:** exibe quantos dias consecutivos foram preenchidos (🔥 Xd).
- Busca no histórico por palavras-chave.

---

## Flashcards

**Rota:** Evolução → Flashcards

Sistema de revisão baseado em **SRS (Spaced Repetition System)** — os cards reaparecem nos momentos mais eficientes para fixação na memória de longo prazo.

**Interface de revisão:**
1. Selecione uma disciplina (ou "Todos") para filtrar os cards devidos.
2. Leia a frente do card (pergunta).
3. Clique para revelar o verso (resposta).
4. Avalie sua performance:

| Botão | Significado | Próxima aparição |
|---|---|---|
| 😓 Difícil | Não lembrou bem | Em breve |
| 🤔 Normal | Lembrou com esforço | Intervalo moderado |
| 😊 Fácil | Lembrou com facilidade | Intervalo longo |

**Barra de progresso:** mostra quantos cards foram revisados na sessão atual.

**Ao concluir todos os cards:**
- Se houver cards marcados como "Difícil", aparece a opção "🔁 Revisar difíceis (X)" para repetir somente eles.

**Editar cards:** passe o mouse sobre a pergunta e clique em ✏ para editar o enunciado ou a resposta.

---

## Relatório

**Rota:** Performance → Relatório

Visão consolidada de todo o conteúdo estudado, com exportação.

---

### Questões e Flashcards

**Stats gerais (5 cards):**
- Total de itens, sem revisão, acertos, erros e aproveitamento geral.

**Filtros:**
- Pills de disciplinas.
- Busca por enunciado, matéria ou banca.
- Ordenação: mais recentes, mais erros, menor/maior taxa, mais revisadas.

**Tabela unificada:**
Exibe sessões e flashcards numa mesma listagem com colunas de enunciado, disciplina, matéria, banca, acertos, erros, taxa, data e último rating SRS.

Clique para expandir e ver os detalhes completos de cada item.

**Exportar CSV:**
Gera um arquivo `newage-questoes-YYYY-MM-DD.csv` com todos os dados visíveis (respeitando filtros ativos).

---

### Relatório Semanal

Consolidado semanal do desempenho para acompanhamento de progresso ao longo do tempo.

---

## Sistema de Patentes

As patentes representam o nível geral do estudo com base no percentual da meta total de questões atingida.

- Cada patente tem um limiar mínimo de progresso.
- Dentro de cada patente, há sub-níveis: **N1** (comum), **N2** (raro), **N3** (épico) — indicados por um badge colorido.
- Sub-nível N3 ganha animação de pulsação no avatar.
- Ao atingir uma nova patente, aparece um **modal de promoção** com a insígnia e uma mensagem motivacional.

---

## Sistema de Conquistas

Mais de 60 conquistas distribuídas em categorias:

| Categoria | Exemplos |
|---|---|
| Volume | Fazer X questões totais |
| Precisão | Atingir X% de acurácia em uma matéria |
| Sequência | Streak de X dias consecutivos |
| Sessões | Completar X sessões |
| Frentes | Estudar X disciplinas diferentes |
| Ofensiva | Questões feitas em um único dia |
| Elite | Dias com ≥ 80% de acerto e ≥ 10 questões |

Conquistas bloqueadas exibem uma barra de progresso até o próximo desbloqueio.

---

## Integração com QConcursos

A extensão do Chrome **New Age · QConcursos** registra automaticamente as sessões de questões feitas no site do QConcursos, sem precisar preencher o formulário manualmente.

**Como instalar:**
1. Abra o Chrome e acesse `chrome://extensions`.
2. Ative o **Modo do desenvolvedor** (canto superior direito).
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `extension/` dentro do projeto.

Após instalada, a extensão aparece na barra do Chrome. As sessões registradas via extensão são identificadas como "QConcursos" no Histórico.

---

*New Age — estude com propósito, evolua com dados.*
