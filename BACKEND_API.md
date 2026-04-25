# StudyBI — Documento de Negócio e Especificação de API Backend

## 1. Visão Geral do Negócio

**StudyBI** é uma plataforma web gamificada de preparação para concursos públicos brasileiros, com foco em vagas de TI em Tribunais (TSE, TRE, TJ, TCU, etc.).

O candidato registra sessões de estudo por disciplina e matéria, pratica com flashcards usando revisão espaçada (SRS), acompanha metas diárias/semanais/mensais/anuais e progride num sistema de gamificação com XP, níveis, conquistas e árvore de habilidades.

### Problema que resolve
- Candidatos a concursos de TI estudam muitas disciplinas diferentes e perdem o controle do que estudaram, do que erraram e do que precisam revisar.
- Não há visibilidade de progresso ao longo do tempo.
- A motivação cai sem estrutura de metas e recompensas.

### Perfil do usuário
Candidato a concursos públicos de nível superior (Analista de TI, Analista Judiciário), que estuda por meses ou anos, com foco em bancas como FGV, CESPE/CEBRASPE, FCC, VUNESP.

---

## 2. Entidades do Domínio

### 2.1 Session (Sessão de Estudo)
Representa um bloco de questões resolvidas pelo usuário.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `user_id` | UUID | Referência ao usuário |
| `ts` | bigint | Timestamp Unix (ms) de criação |
| `date` | string | Data no formato `YYYY-MM-DD` |
| `disc` | string | Disciplina (ex: "Tecnologia da Informação") |
| `mat` | string | Matéria dentro da disciplina (ex: "Banco de Dados") |
| `total` | int | Total de questões resolvidas na sessão |
| `correct` | int | Total de acertos |
| `banca` | string | Banca examinadora (ex: "FGV", "CESPE") |
| `source` | string? | Origem (ex: `"flashcard"` para sessões geradas por review) |
| `created_at` | timestamp? | Timestamp de inserção no banco |

### 2.2 Flashcard
Cartão de estudo com sistema de revisão espaçada (SRS).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `user_id` | UUID | Referência ao usuário |
| `ts` | bigint | Timestamp de criação |
| `disc` | string | Disciplina |
| `mat` | string | Matéria |
| `q` | string | Pergunta (frente do cartão) |
| `a` | string | Resposta (verso do cartão) |
| `banca` | string | Banca referência |
| `reviews` | JSON array | Array de `FlashcardReview` |
| `created_at` | timestamp? | Timestamp de inserção |

#### FlashcardReview (subdocumento dentro de `reviews`)

| Campo | Tipo | Descrição |
|---|---|---|
| `ts` | bigint | Timestamp da avaliação |
| `rating` | 1 \| 2 \| 3 | 1 = Difícil, 2 = Normal, 3 = Fácil |
| `nextDue` | bigint | Timestamp de quando o card deve ser revisado novamente |

### 2.3 UserConfig (Configuração de Metas)

| Campo | Tipo | Descrição |
|---|---|---|
| `user_id` | UUID | Referência ao usuário |
| `daily` | int | Meta diária de questões (padrão: 30) |
| `weekly` | int | Meta semanal (padrão: 200) |
| `monthly` | int | Meta mensal (padrão: 500) |
| `big_goal` | int | Meta anual total (padrão: 1000) |

### 2.4 Banca
Lista de bancas examinadoras configuradas por usuário. Cada usuário tem sua lista (pode adicionar ou remover bancas).

### 2.5 Discipline
Mapa de disciplinas → matérias configurado por usuário. Estrutura: `Record<string, string[]>`.

### 2.6 VerbConjugation (módulo futuro)

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `user_id` | UUID | Referência ao usuário |
| `ts` | bigint | Timestamp |
| `verbo` | string | Verbo no infinitivo |
| `tempo` | string | Tempo verbal |
| `eu` | string | Conjugação 1ª pessoa singular |
| `tu` | string | Conjugação 2ª pessoa singular |
| `ele_ela` | string | Conjugação 3ª pessoa singular |
| `nos` | string | Conjugação 1ª pessoa plural |
| `vos` | string | Conjugação 2ª pessoa plural |
| `eles_elas` | string | Conjugação 3ª pessoa plural |

---

## 3. Dados Atualmente Mockados (a migrar para o backend)

Os itens abaixo estão hardcoded no frontend e precisam vir do backend:

| Dado mockado | Localização atual | O que fazer |
|---|---|---|
| Lista de disciplinas e matérias padrão | `src/store/defaults.ts` → `DEFAULT_DISC` | Endpoint de seed/config padrão por usuário |
| Lista de bancas padrão | `src/store/defaults.ts` → `DEFAULT_BANCAS` | Endpoint de seed/config padrão por usuário |
| Metas padrão (daily, weekly, monthly, big_goal) | `src/store/defaults.ts` → `DEFAULT_CONFIG` | Criar registro em `user_config` no cadastro |
| Estrutura da árvore de habilidades (SkillTree) | `src/lib/skillTreeData.ts` → `SKILL_FOREST` | Endpoint de árvore de habilidades |
| Dicas motivacionais | `src/lib/constants.ts` → `TIPS` | Pode ficar no frontend ou vir de endpoint |
| Algoritmo SRS (cálculo de intervalos) | `src/lib/srs.ts` | Manter no frontend (não precisa de backend) |
| Sistema de XP/níveis/conquistas | `src/components/personagem/Personagem.tsx` | Calcular no backend ou manter no frontend baseado em sessões reais |

---

## 4. Especificação de Endpoints da API

### Convenções

- Base URL: `https://api.studybi.com/v1` (ou equivalente)
- Autenticação: Bearer Token JWT (Supabase Auth)
- Todos os requests autenticados incluem `Authorization: Bearer <token>`
- Formato de resposta: JSON
- Erros seguem o padrão: `{ "error": "mensagem", "code": "ERROR_CODE" }`
- Datas em formato `YYYY-MM-DD`, timestamps em ms (Unix)

---

### 4.1 Auth

O Supabase Auth já cuida de registro, login e refresh de tokens. Não é necessário implementar endpoints customizados de auth, mas o backend deve:

- Validar o JWT em cada request
- Extrair o `user_id` do token para filtrar dados

**Fluxo atual:**
```
POST /auth/v1/signup   → Supabase (registro com email + senha)
POST /auth/v1/token    → Supabase (login)
POST /auth/v1/logout   → Supabase (logout)
```

**Ação necessária:** Ao criar conta, disparar um webhook ou trigger no banco que crie os registros iniciais (user_config, bancas, disciplines) com valores padrão.

---

### 4.2 Sessions

#### `GET /sessions`
Retorna as sessões recentes do usuário (para uso na UI e cálculo de stats).

**Query params:**
| Param | Tipo | Padrão | Descrição |
|---|---|---|---|
| `limit` | int | 500 | Máximo de registros |
| `offset` | int | 0 | Paginação |
| `date_from` | string | — | Filtro data início (`YYYY-MM-DD`) |
| `date_to` | string | — | Filtro data fim (`YYYY-MM-DD`) |
| `disc` | string | — | Filtrar por disciplina |
| `mat` | string | — | Filtrar por matéria |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "ts": 1712000000000,
      "date": "2026-04-12",
      "disc": "Tecnologia da Informação",
      "mat": "Banco de Dados",
      "total": 20,
      "correct": 16,
      "banca": "FGV",
      "source": null,
      "created_at": "2026-04-12T10:00:00Z"
    }
  ],
  "total": 1,
  "limit": 500,
  "offset": 0
}
```

---

#### `GET /sessions/stats`
Retorna versão leve de todas as sessões (para cálculos all-time). Apenas os campos necessários para estatísticas.

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "date": "2026-04-12",
      "total": 20,
      "correct": 16,
      "disc": "Tecnologia da Informação",
      "mat": "Banco de Dados"
    }
  ]
}
```

---

#### `POST /sessions`
Registra uma nova sessão de estudo.

**Body:**
```json
{
  "ts": 1712000000000,
  "date": "2026-04-12",
  "disc": "Tecnologia da Informação",
  "mat": "Banco de Dados",
  "total": 20,
  "correct": 16,
  "banca": "FGV",
  "source": null
}
```

**Response `201`:**
```json
{
  "data": { ...session_completa }
}
```

---

#### `DELETE /sessions/:id`
Remove uma sessão.

**Response `200`:**
```json
{ "message": "Session removed" }
```

---

### 4.3 Flashcards

#### `GET /flashcards`
Retorna os flashcards do usuário.

**Query params:**
| Param | Tipo | Padrão | Descrição |
|---|---|---|---|
| `limit` | int | 2000 | Máximo de registros |
| `disc` | string | — | Filtrar por disciplina |
| `due_only` | bool | false | Retornar apenas cards com review pendente |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "ts": 1712000000000,
      "disc": "Tecnologia da Informação",
      "mat": "Banco de Dados",
      "q": "O que é uma chave primária?",
      "a": "É um campo (ou conjunto de campos) que identifica unicamente cada linha de uma tabela.",
      "banca": "FGV",
      "reviews": [
        { "ts": 1712000000000, "rating": 2, "nextDue": 1712259200000 }
      ],
      "created_at": "2026-04-12T10:00:00Z"
    }
  ]
}
```

---

#### `POST /flashcards`
Cria um novo flashcard.

**Body:**
```json
{
  "ts": 1712000000000,
  "disc": "Tecnologia da Informação",
  "mat": "Banco de Dados",
  "q": "O que é uma chave primária?",
  "a": "É um campo que identifica unicamente cada linha.",
  "banca": "FGV"
}
```

**Response `201`:**
```json
{
  "data": { ...flashcard_completo }
}
```

---

#### `PATCH /flashcards/:id`
Atualiza um flashcard (principalmente para salvar reviews após estudo com SRS).

**Body (parcial):**
```json
{
  "reviews": [
    { "ts": 1712000000000, "rating": 3, "nextDue": 1712604800000 }
  ]
}
```

**Response `200`:**
```json
{
  "data": { ...flashcard_atualizado }
}
```

---

#### `DELETE /flashcards/:id`
Remove um flashcard.

**Response `200`:**
```json
{ "message": "Flashcard removed" }
```

---

### 4.4 User Config (Metas)

#### `GET /config`
Retorna a configuração de metas do usuário.

**Response `200`:**
```json
{
  "data": {
    "user_id": "uuid",
    "daily": 30,
    "weekly": 200,
    "monthly": 500,
    "big_goal": 1000
  }
}
```

---

#### `PUT /config`
Cria ou atualiza (upsert) a configuração de metas.

**Body:**
```json
{
  "daily": 40,
  "weekly": 250,
  "monthly": 600,
  "big_goal": 1500
}
```

**Response `200`:**
```json
{
  "data": { ...config_atualizado }
}
```

---

### 4.5 Bancas (Bancas Examinadoras do Usuário)

#### `GET /bancas`
Retorna a lista de bancas do usuário.

**Response `200`:**
```json
{
  "data": ["FGV", "CESPE", "FCC", "VUNESP", "ESAF", "CESGRANRIO", "IADES", "QUADRIX", "AOCP", "Não informada"]
}
```

---

#### `PUT /bancas`
Substitui a lista completa de bancas do usuário.

**Body:**
```json
{
  "bancas": ["FGV", "CESPE", "FCC", "Minha banca customizada"]
}
```

**Response `200`:**
```json
{
  "data": ["FGV", "CESPE", "FCC", "Minha banca customizada"]
}
```

---

### 4.6 Disciplines (Disciplinas e Matérias do Usuário)

#### `GET /disciplines`
Retorna o mapa de disciplinas → matérias do usuário.

**Response `200`:**
```json
{
  "data": {
    "Tecnologia da Informação": [
      "Banco de Dados",
      "SQL",
      "Redes de Computadores",
      "Segurança da Informação",
      "Engenharia de Software",
      "Sistemas Operacionais",
      "Governança de TI",
      "ITIL e COBIT"
    ],
    "Raciocínio Lógico": [
      "Lógica Proposicional",
      "Raciocínio Quantitativo",
      "Sequências e Séries",
      "Probabilidade",
      "Análise Combinatória"
    ]
  }
}
```

---

#### `PUT /disciplines`
Substitui o mapa completo de disciplinas do usuário.

**Body:**
```json
{
  "disciplines": {
    "Tecnologia da Informação": ["Banco de Dados", "SQL"],
    "Nova Disciplina": ["Matéria 1", "Matéria 2"]
  }
}
```

**Response `200`:**
```json
{
  "data": { ...disciplines_atualizados }
}
```

---

### 4.7 Skill Tree (Árvore de Habilidades)

#### `GET /skill-tree`
Retorna a estrutura da árvore de habilidades. Pode ser global (padrão para todos os usuários) ou customizada por usuário no futuro.

**Response `200`:**
```json
{
  "data": [
    {
      "id": "fonetica",
      "label": "Fonética",
      "icon": "Aα",
      "disc": "Fonética",
      "children": [
        {
          "id": "fonologia",
          "label": "Fonologia",
          "disc": "Fonética",
          "mat": "Fonologia",
          "children": []
        },
        {
          "id": "ortografia",
          "label": "Ortografia",
          "disc": "Fonética",
          "mat": "Ortografia",
          "children": []
        }
      ]
    }
  ]
}
```

> **Nota:** Atualmente a árvore está hardcoded em `src/lib/skillTreeData.ts`. A migração para o backend permite que a estrutura da árvore possa ser editada por administradores sem deploy de frontend.

---

### 4.8 Stats Agregados (Endpoint calculado no backend)

Para evitar enviar milhares de sessões ao frontend e fazer cálculos no cliente, o backend pode oferecer endpoints de stats já agregados.

#### `GET /stats/summary`
Retorna um resumo consolidado para o dashboard.

**Response `200`:**
```json
{
  "data": {
    "total": 850,
    "correct": 680,
    "errors": 170,
    "accuracy": 80.0,
    "today_total": 25,
    "week_total": 140,
    "month_total": 490,
    "streak": 7,
    "best_streak": 15,
    "goal_pct": 85.0,
    "daily_pct": 83.3
  }
}
```

---

#### `GET /stats/heatmap`
Retorna dados para o heatmap dos últimos 12 meses (total de questões por dia).

**Response `200`:**
```json
{
  "data": [
    { "date": "2026-04-12", "total": 25 },
    { "date": "2026-04-11", "total": 30 },
    { "date": "2026-04-10", "total": 0 }
  ]
}
```

---

#### `GET /stats/by-disc`
Retorna totais por disciplina para o gráfico de distribuição.

**Response `200`:**
```json
{
  "data": [
    { "disc": "Tecnologia da Informação", "total": 320, "correct": 256 },
    { "disc": "Raciocínio Lógico", "total": 180, "correct": 126 },
    { "disc": "Direito Constitucional", "total": 150, "correct": 120 }
  ]
}
```

---

#### `GET /stats/by-mat`
Retorna totais por matéria (para o componente TopSubjects — top matérias mais estudadas).

**Query params:**
| Param | Tipo | Padrão | Descrição |
|---|---|---|---|
| `limit` | int | 8 | Número de matérias a retornar |
| `disc` | string | — | Filtrar por disciplina |

**Response `200`:**
```json
{
  "data": [
    { "disc": "Tecnologia da Informação", "mat": "Banco de Dados", "total": 120, "correct": 96 },
    { "disc": "Tecnologia da Informação", "mat": "SQL", "total": 95, "correct": 76 }
  ]
}
```

---

#### `GET /stats/daily-series`
Retorna totais dos últimos N dias para o gráfico de barras diário.

**Query params:**
| Param | Tipo | Padrão | Descrição |
|---|---|---|---|
| `days` | int | 14 | Número de dias para retornar |

**Response `200`:**
```json
{
  "data": [
    { "date": "2026-04-12", "total": 25, "correct": 20 },
    { "date": "2026-04-11", "total": 30, "correct": 22 }
  ]
}
```

---

### 4.9 Gamificação (Personagem)

O sistema de gamificação é atualmente calculado no frontend com base nas sessões. O backend pode oferecer esses dados calculados para performance e consistência.

#### `GET /character`
Retorna o estado do personagem do usuário.

**Response `200`:**
```json
{
  "data": {
    "user_id": "uuid",
    "xp": 850,
    "level": 5,
    "level_title": "Expert",
    "level_emoji": "🔥",
    "xp_next_level": 900,
    "achievements": [
      {
        "id": "first_question",
        "label": "Primeira Questão",
        "description": "Resolveu sua primeira questão",
        "unlocked": true,
        "unlocked_at": "2025-12-01T10:00:00Z"
      },
      {
        "id": "streak_7",
        "label": "Semana de Fogo",
        "description": "7 dias seguidos estudando",
        "unlocked": false,
        "unlocked_at": null
      }
    ],
    "stats": {
      "total_questions": 850,
      "total_correct": 680,
      "accuracy": 80.0,
      "streak": 7,
      "best_streak": 15,
      "subjects_studied": 12,
      "disciplines_studied": 4
    }
  }
}
```

---

### 4.10 Verbos (Módulo Futuro)

#### `GET /verb-conjugations`
Retorna conjugações salvas pelo usuário.

#### `POST /verb-conjugations`
Salva uma nova conjugação.

#### `GET /verb-sessions`
Retorna sessões de prática de verbos.

#### `POST /verb-sessions`
Registra uma sessão de prática de verbos.

---

### 4.11 Onboarding / Seed de Dados Iniciais

#### `POST /onboarding`
Chamado uma única vez após o cadastro do usuário para criar todos os registros iniciais com valores padrão.

**Response `201`:**
```json
{
  "message": "User initialized",
  "data": {
    "config": { "daily": 30, "weekly": 200, "monthly": 500, "big_goal": 1000 },
    "bancas": ["FGV", "CESPE", "FCC", "VUNESP", "ESAF", "CESGRANRIO", "IADES", "QUADRIX", "AOCP", "Não informada"],
    "disciplines": { ...DEFAULT_DISC }
  }
}
```

> Alternativa: criar esses registros via trigger no banco de dados (ex: Supabase Database Trigger ou Edge Function `on auth.users insert`).

---

## 5. Tabelas do Banco de Dados

```sql
-- Sessões de estudo
CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ts          BIGINT NOT NULL,
  date        DATE NOT NULL,
  disc        TEXT NOT NULL,
  mat         TEXT NOT NULL,
  total       INT NOT NULL CHECK (total > 0),
  correct     INT NOT NULL CHECK (correct >= 0),
  banca       TEXT NOT NULL,
  source      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Flashcards
CREATE TABLE flashcards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ts          BIGINT NOT NULL,
  disc        TEXT NOT NULL,
  mat         TEXT NOT NULL,
  q           TEXT NOT NULL,
  a           TEXT NOT NULL,
  banca       TEXT NOT NULL,
  reviews     JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Configuração e metas do usuário
CREATE TABLE user_config (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily       INT NOT NULL DEFAULT 30,
  weekly      INT NOT NULL DEFAULT 200,
  monthly     INT NOT NULL DEFAULT 500,
  big_goal    INT NOT NULL DEFAULT 1000,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Bancas por usuário
CREATE TABLE bancas (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data        JSONB NOT NULL DEFAULT '[]',
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Disciplinas e matérias por usuário
CREATE TABLE disciplines (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data        JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Árvore de habilidades (global, gerenciada por admin)
CREATE TABLE skill_tree (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data        JSONB NOT NULL,
  version     INT NOT NULL DEFAULT 1,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Conjugações de verbos (módulo futuro)
CREATE TABLE verb_conjugations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ts          BIGINT NOT NULL,
  verbo       TEXT NOT NULL,
  tempo       TEXT NOT NULL,
  eu          TEXT,
  tu          TEXT,
  ele_ela     TEXT,
  nos         TEXT,
  vos         TEXT,
  eles_elas   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Sessões de prática de verbos (módulo futuro)
CREATE TABLE verb_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verb_id     UUID REFERENCES verb_conjugations(id),
  ts          BIGINT NOT NULL,
  date        DATE NOT NULL,
  score       INT NOT NULL,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### Índices recomendados

```sql
-- Sessions: consultas frequentes por usuário e data
CREATE INDEX idx_sessions_user_date ON sessions(user_id, date DESC);
CREATE INDEX idx_sessions_user_disc ON sessions(user_id, disc);
CREATE INDEX idx_sessions_user_mat  ON sessions(user_id, mat);

-- Flashcards: consultas por usuário
CREATE INDEX idx_flashcards_user ON flashcards(user_id);
CREATE INDEX idx_flashcards_user_disc ON flashcards(user_id, disc);

-- Row Level Security (Supabase)
ALTER TABLE sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_config       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bancas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines       ENABLE ROW LEVEL SECURITY;
ALTER TABLE verb_conjugations ENABLE ROW LEVEL SECURITY;
ALTER TABLE verb_sessions     ENABLE ROW LEVEL SECURITY;

-- Policies (cada usuário vê apenas seus dados)
CREATE POLICY "user_own_sessions"
  ON sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_own_flashcards"
  ON flashcards FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_own_config"
  ON user_config FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_own_bancas"
  ON bancas FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_own_disciplines"
  ON disciplines FOR ALL USING (auth.uid() = user_id);
```

---

## 6. Fluxo de Dados: Frontend → Backend

```
Usuário cadastra conta
  → Supabase Auth cria user
  → Trigger/Webhook → POST /onboarding
  → Cria user_config, bancas e disciplines com defaults

Usuário abre o app (loadAll)
  → GET /sessions?limit=500         (UI recente)
  → GET /sessions/stats             (all-time, leve)
  → GET /flashcards?limit=2000
  → GET /config
  → GET /bancas
  → GET /disciplines

Usuário registra sessão de estudo
  → POST /sessions
  → Store atualiza sessions[] localmente (otimistic update)

Usuário faz review de flashcard
  → PATCH /flashcards/:id  (salva reviews com SRS)

Usuário atualiza metas
  → PUT /config

Usuário acessa Dashboard
  → (dados já no store, calcula localmente)
  → OU: GET /stats/summary + /stats/heatmap + /stats/daily-series

Usuário acessa Personagem
  → (calcula XP/level/conquistas no frontend com dados do store)
  → OU: GET /character (se cálculo migrar para backend)

Usuário acessa Árvore de Habilidades
  → GET /skill-tree  (em vez de hardcoded)
  → Cruza com sessions para calcular progresso por nó
```

---

## 7. Prioridade de Implementação

### Fase 1 — Core (já parcialmente no Supabase)
- [ ] Tabelas: `sessions`, `flashcards`, `user_config`, `bancas`, `disciplines`
- [ ] RLS policies para todas as tabelas
- [ ] `GET /sessions`, `POST /sessions`, `DELETE /sessions/:id`
- [ ] `GET /sessions/stats`
- [ ] `GET /flashcards`, `POST /flashcards`, `PATCH /flashcards/:id`, `DELETE /flashcards/:id`
- [ ] `GET /config`, `PUT /config`
- [ ] `GET /bancas`, `PUT /bancas`
- [ ] `GET /disciplines`, `PUT /disciplines`
- [ ] Trigger de onboarding no cadastro

### Fase 2 — Stats Calculados no Backend
- [ ] `GET /stats/summary`
- [ ] `GET /stats/heatmap`
- [ ] `GET /stats/by-disc`
- [ ] `GET /stats/by-mat`
- [ ] `GET /stats/daily-series`

### Fase 3 — Gamificação e Skill Tree
- [ ] Tabela e endpoint `GET /skill-tree`
- [ ] `GET /character` (XP, nível, conquistas calculados no backend)

### Fase 4 — Módulos Futuros
- [ ] Verbos: `verb_conjugations`, `verb_sessions` e seus endpoints
- [ ] Módulo de Análise (`/analise`) — ainda não implementado no frontend
- [ ] Módulo de Histórico (`/historico`) — ainda não implementado no frontend
- [ ] Módulo de Matérias (`/materias`) — ainda não implementado no frontend

---

## 8. Considerações Técnicas

### Algoritmo SRS
O cálculo de `nextDue` para flashcards é feito inteiramente no frontend (`src/lib/srs.ts`). Não há necessidade de mover esse cálculo para o backend — o frontend salva o resultado via `PATCH /flashcards/:id`.

### Performance
- O frontend atualmente busca até 2000 flashcards e 500 sessões de uma vez. Para volumes maiores, implementar paginação real e/ou mover os cálculos de stats para o backend (Fase 2).
- O heatmap exige dados de 365 dias — o endpoint `/stats/heatmap` precisa ser eficiente (um `GROUP BY date` na query).

### Supabase vs API REST Própria
O projeto já usa o Supabase client diretamente no frontend (`src/lib/supabase.ts`). Pode-se manter essa abordagem (Supabase como backend-as-a-service com RLS) ou criar uma API REST própria que chama o Supabase internamente. A segunda opção oferece mais controle sobre regras de negócio e performance.
