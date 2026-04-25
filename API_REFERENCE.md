# API Reference — StudyBI Backend

**Base URL:** `http://localhost:8080`  
**Todas as rotas `/v1/*` exigem autenticação.**

---

## Autenticação

Toda requisição às rotas `/v1/*` deve enviar o JWT do Supabase no header:

```
Authorization: Bearer <supabase_access_token>
```

O `user_id` é extraído automaticamente do campo `sub` do token — nunca precisa ser enviado no body.

**Erros de auth:**
```json
{ "error": "token inválido", "code": "INVALID_TOKEN" }   // 401
{ "error": "token não fornecido", "code": "UNAUTHORIZED" } // 401
```

---

## Health Check

```
GET /health
```
```json
{ "status": "ok" }
```

---

## Onboarding

Deve ser chamado logo após o primeiro login para criar as configurações padrão do usuário. Usa `ON CONFLICT DO NOTHING`, então é seguro chamar mais de uma vez.

```
POST /v1/onboarding
```
**Response 201:**
```json
{
  "message": "User initialized",
  "data": {
    "config": { "user_id": "...", "daily": 30, "weekly": 200, "monthly": 500, "big_goal": 1000 },
    "bancas": ["FGV", "CESPE", "FCC", "VUNESP", "ESAF", "CESGRANRIO", "IADES", "QUADRIX", "AOCP", "Não informada"],
    "disciplines": {
      "Tecnologia da Informação": ["Banco de Dados", "SQL", "Redes de Computadores", "..."],
      "Raciocínio Lógico": ["Lógica Proposicional", "..."],
      "Língua Portuguesa": ["Gramática", "..."],
      "Direito Constitucional": ["Princípios Fundamentais", "..."],
      "Direito Administrativo": ["Atos Administrativos", "..."],
      "Administração Pública": ["Gestão de Pessoas", "..."]
    }
  }
}
```

---

## Config (Metas)

```
GET /v1/config
```
Retorna as metas do usuário. Se ainda não existir retorna os defaults.

**Response 200:**
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

```
PUT /v1/config
```
**Body:**
```json
{
  "daily": 50,
  "weekly": 300,
  "monthly": 800,
  "big_goal": 5000
}
```
**Response 200:** mesmo formato do GET.

---

## Bancas

```
GET /v1/bancas
```
**Response 200:**
```json
{ "data": ["FGV", "CESPE", "FCC"] }
```

---

```
PUT /v1/bancas
```
**Body:**
```json
{ "bancas": ["FGV", "CESPE", "FCC"] }
```
**Response 200:** `{ "data": ["FGV", "CESPE", "FCC"] }`

---

## Disciplines

```
GET /v1/disciplines
```
**Response 200:**
```json
{
  "data": {
    "Tecnologia da Informação": ["Banco de Dados", "SQL"],
    "Raciocínio Lógico": ["Lógica Proposicional"]
  }
}
```

---

```
PUT /v1/disciplines
```
**Body:**
```json
{
  "disciplines": {
    "Tecnologia da Informação": ["Banco de Dados", "SQL"],
    "Raciocínio Lógico": ["Lógica Proposicional"]
  }
}
```
**Response 200:** mesmo formato do GET.

---

## Sessions

### Listar sessões
```
GET /v1/sessions
```
**Query params (todos opcionais):**
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `limit` | int | 500 | Máx de registros |
| `offset` | int | 0 | Paginação |
| `date_from` | string | — | Filtro `YYYY-MM-DD` (inclusivo) |
| `date_to` | string | — | Filtro `YYYY-MM-DD` (inclusivo) |
| `disc` | string | — | Filtrar por disciplina |
| `mat` | string | — | Filtrar por matéria |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "ts": 1714000000000,
      "date": "2024-04-25",
      "disc": "Tecnologia da Informação",
      "mat": "Banco de Dados",
      "total": 20,
      "correct": 15,
      "banca": "CESPE",
      "source": null,
      "created_at": "2024-04-25T10:00:00Z"
    }
  ],
  "total": 42,
  "limit": 500,
  "offset": 0
}
```

---

### Stats leves (all-time)
```
GET /v1/sessions/stats
```
Retorna todas as sessões com campos reduzidos, sem paginação. Usado para cálculos client-side.

**Response 200:**
```json
{
  "data": [
    { "id": "uuid", "date": "2024-04-25", "total": 20, "correct": 15, "disc": "TI", "mat": "SQL" }
  ]
}
```

---

### Criar sessão
```
POST /v1/sessions
```
**Body:**
```json
{
  "ts": 1714000000000,
  "date": "2024-04-25",
  "disc": "Tecnologia da Informação",
  "mat": "Banco de Dados",
  "total": 20,
  "correct": 15,
  "banca": "CESPE",
  "source": null
}
```
- `ts`: timestamp Unix em **milissegundos**
- `total` deve ser > 0
- `correct` deve estar entre 0 e `total`

**Response 201:** `{ "data": { ...session } }`

---

### Deletar sessão
```
DELETE /v1/sessions/:id
```
**Response 200:** `{ "message": "Session removed" }`  
**Response 404:** `{ "error": "sessão não encontrada", "code": "NOT_FOUND" }`

---

## Flashcards

### Listar
```
GET /v1/flashcards
```
**Query params (todos opcionais):**
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `limit` | int | 2000 | Máx de registros |
| `disc` | string | — | Filtrar por disciplina |
| `due_only` | `"true"` | — | Retorna só cards com revisão pendente |

**Lógica de `due_only`:** cards sem nenhuma review são sempre incluídos. Cards com review: inclui se `reviews[last].nextDue <= Date.now()`.

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "ts": 1714000000000,
      "disc": "Tecnologia da Informação",
      "mat": "SQL",
      "q": "O que é uma JOIN?",
      "a": "Operação que combina linhas de duas tabelas...",
      "banca": "CESPE",
      "reviews": [
        { "ts": 1714000000000, "rating": 3, "nextDue": 1714864000000 }
      ]
    }
  ]
}
```

---

### Criar flashcard
```
POST /v1/flashcards
```
**Body:**
```json
{
  "ts": 1714000000000,
  "disc": "Tecnologia da Informação",
  "mat": "SQL",
  "q": "O que é uma JOIN?",
  "a": "Operação que combina linhas de duas tabelas...",
  "banca": "CESPE"
}
```
`reviews` começa vazio — gerenciado via PATCH.

**Response 201:** `{ "data": { ...flashcard } }`

---

### Atualizar reviews (SRS)
```
PATCH /v1/flashcards/:id
```
Substitui completamente o array de reviews. Enviar o array completo acumulado.

**Body:**
```json
{
  "reviews": [
    { "ts": 1714000000000, "rating": 2, "nextDue": 1714432000000 },
    { "ts": 1714432000000, "rating": 3, "nextDue": 1715296000000 }
  ]
}
```
- `rating`: `1` = Difícil, `2` = Normal, `3` = Fácil
- `ts` e `nextDue`: timestamps Unix em **milissegundos**

**Response 200:** `{ "data": { ...flashcard } }`

---

### Deletar flashcard
```
DELETE /v1/flashcards/:id
```
**Response 200:** `{ "message": "Flashcard removed" }`

---

## Stats

### Summary (Dashboard principal)
```
GET /v1/stats/summary
```
Usa as metas do usuário para calcular `goal_pct` e `daily_pct`.

**Response 200:**
```json
{
  "data": {
    "total": 1500,
    "correct": 1050,
    "errors": 450,
    "accuracy": 70.0,
    "today_total": 25,
    "week_total": 180,
    "month_total": 620,
    "streak": 5,
    "best_streak": 12,
    "goal_pct": 62.0,
    "daily_pct": 83.3
  }
}
```
- `goal_pct` = `total / big_goal * 100`
- `daily_pct` = `today_total / daily * 100`

---

### Heatmap
```
GET /v1/stats/heatmap
```
**Response 200:**
```json
{
  "data": [
    { "date": "2024-04-01", "total": 45 },
    { "date": "2024-04-02", "total": 0 }
  ]
}
```

---

### Por Disciplina
```
GET /v1/stats/by-disc
```
**Response 200:**
```json
{
  "data": [
    { "disc": "Tecnologia da Informação", "total": 800, "correct": 560 }
  ]
}
```

---

### Por Matéria
```
GET /v1/stats/by-mat
```
**Query params:**
| Param | Default | Descrição |
|-------|---------|-----------|
| `limit` | 8 | Top N matérias |
| `disc` | — | Filtrar por disciplina |

**Response 200:**
```json
{
  "data": [
    { "disc": "Tecnologia da Informação", "mat": "Banco de Dados", "total": 200, "correct": 140 }
  ]
}
```

---

### Série Diária
```
GET /v1/stats/daily-series
```
**Query params:**
| Param | Default | Descrição |
|-------|---------|-----------|
| `days` | 14 | Quantos dias para trás |

**Response 200:**
```json
{
  "data": [
    { "date": "2024-04-25", "total": 30, "correct": 22 },
    { "date": "2024-04-24", "total": 0, "correct": 0 }
  ]
}
```

---

## Character (Gamificação)

```
GET /v1/character
```
Calculado em tempo real a partir das sessões.

**Response 200:**
```json
{
  "data": {
    "user_id": "uuid",
    "xp": 1500,
    "level": 5,
    "level_title": "Dedicado",
    "level_emoji": "🎯",
    "xp_next_level": 1500,
    "stats": {
      "total_questions": 1500,
      "total_correct": 1050,
      "accuracy": 70.0,
      "streak": 5,
      "best_streak": 12,
      "subjects_studied": 18,
      "disciplines_studied": 4
    },
    "achievements": [
      {
        "id": "first_question",
        "label": "Primeira Questão",
        "description": "Resolveu sua primeira questão",
        "unlocked": true,
        "unlocked_at": "2024-01-10"
      }
    ]
  }
}
```

**XP = total de questões respondidas.**

**Níveis:**
| Level | XP mínimo | Título | Emoji |
|-------|-----------|--------|-------|
| 1 | 0 | Novato | 🌱 |
| 2 | 100 | Iniciante | ⭐ |
| 3 | 300 | Aprendiz | 📚 |
| 4 | 600 | Praticante | 💪 |
| 5 | 1000 | Dedicado | 🎯 |
| 6 | 1500 | Expert | 🔥 |
| 7 | 2500 | Avançado | ⚡ |
| 8 | 4000 | Mestre | 🏆 |
| 9 | 6000 | Especialista | 💎 |
| 10 | 10000 | Lenda | 👑 |

**Achievements:**
| ID | Label | Condição |
|----|-------|----------|
| `first_question` | Primeira Questão | total ≥ 1 |
| `century` | Centurião | total ≥ 100 |
| `thousand` | Mil Questões | total ≥ 1000 |
| `streak_7` | Semana de Fogo | best_streak ≥ 7 |
| `streak_30` | Mês Imparável | best_streak ≥ 30 |
| `accuracy_90` | Excelência | total ≥ 50 e accuracy ≥ 90% |
| `multi_disc_3` | Multidisciplinar | disciplinas ≥ 3 |
| `multi_disc_5` | Generalista | disciplinas ≥ 5 |

---

## Skill Tree

```
GET /v1/skill-tree
```
Árvore de habilidades global (não é por usuário).

**Response 200:**
```json
{
  "data": [
    {
      "id": "ti",
      "label": "Tecnologia da Informação",
      "icon": "💻",
      "disc": "",
      "mat": "",
      "children": [
        {
          "id": "bd",
          "label": "Banco de Dados",
          "icon": "🗄️",
          "disc": "Tecnologia da Informação",
          "mat": "Banco de Dados",
          "children": []
        }
      ]
    }
  ]
}
```

---

## Erros Padrão

Todos os endpoints de erro seguem o mesmo formato:

```json
{ "error": "mensagem legível", "code": "CODIGO_SNAKE_UPPER" }
```

| HTTP | Code | Quando |
|------|------|--------|
| 400 | `INVALID_BODY` | JSON inválido no body |
| 400 | `INVALID_TOTAL` | `total <= 0` |
| 400 | `INVALID_CORRECT` | `correct` fora do range |
| 401 | `UNAUTHORIZED` | Header Authorization ausente |
| 401 | `INVALID_TOKEN` | JWT inválido ou expirado |
| 404 | `NOT_FOUND` | Recurso não encontrado |
| 500 | `INTERNAL_ERROR` | Erro interno do servidor |

---

## Notas de Integração

**Timestamps:** todos os campos `ts` e `nextDue` são Unix em **milissegundos** (`Date.now()` no JS).

**Datas:** todos os campos `date` são strings `"YYYY-MM-DD"`.

**IDs:** todos os IDs são UUIDs em string.

**Fluxo recomendado no primeiro login:**
1. Autenticar via Supabase
2. Chamar `POST /v1/onboarding` (idempotente)
3. Carregar dados do usuário em paralelo

**Flashcard SRS:** o backend não calcula o intervalo de repetição espaçada — apenas armazena o array de reviews. A lógica de calcular `nextDue` com base no `rating` fica no frontend.
