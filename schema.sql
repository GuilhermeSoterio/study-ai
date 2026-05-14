-- Execute este SQL no painel do Supabase (SQL Editor)

-- SESSIONS
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ts BIGINT NOT NULL,
  date TEXT NOT NULL,
  disc TEXT NOT NULL,
  mat TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  banca TEXT DEFAULT 'Não informada',
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_sessions" ON sessions FOR ALL USING (auth.uid() = user_id);

-- FLASHCARDS
CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ts BIGINT NOT NULL,
  disc TEXT NOT NULL,
  mat TEXT NOT NULL,
  q TEXT NOT NULL,
  a TEXT NOT NULL,
  banca TEXT DEFAULT 'Não informada',
  reviews JSONB DEFAULT '[]',
  ignored BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_flashcards" ON flashcards FOR ALL USING (auth.uid() = user_id);

-- USER CONFIG
CREATE TABLE user_config (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily INTEGER DEFAULT 30,
  big_goal INTEGER DEFAULT 1000,
  weekly INTEGER DEFAULT 200,
  monthly INTEGER DEFAULT 500
);
ALTER TABLE user_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_config" ON user_config FOR ALL USING (auth.uid() = user_id);

-- BANCAS (stored as JSON array per user)
CREATE TABLE bancas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '[]'
);
ALTER TABLE bancas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_bancas" ON bancas FOR ALL USING (auth.uid() = user_id);

-- DISCIPLINES (stored as JSON blob per user)
CREATE TABLE disciplines (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'
);
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_disciplines" ON disciplines FOR ALL USING (auth.uid() = user_id);

-- PURGE RECORDS (Protocolo de Limpeza — erros cancelados por matéria)
CREATE TABLE purge_records (
  id             TEXT PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  disc           TEXT NOT NULL,
  mat            TEXT NOT NULL,
  errors_cleared INTEGER NOT NULL DEFAULT 0,
  purged_at      TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE purge_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_purge_records" ON purge_records FOR ALL USING (auth.uid() = user_id);

-- VERB CONJUGATIONS (exercícios de conjugação verbal)
CREATE TABLE verb_conjugations (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ts BIGINT NOT NULL,
  verbo TEXT NOT NULL,
  tempo TEXT NOT NULL,
  eu TEXT NOT NULL,
  tu TEXT NOT NULL,
  ele_ela TEXT NOT NULL,
  nos TEXT NOT NULL,
  vos TEXT NOT NULL,
  eles_elas TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE verb_conjugations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_verb_conjugations" ON verb_conjugations FOR ALL USING (auth.uid() = user_id);

-- VERB SESSIONS (resultados dos exercícios de conjugação)
CREATE TABLE verb_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verb_id TEXT REFERENCES verb_conjugations(id) ON DELETE CASCADE,
  ts BIGINT NOT NULL,
  date TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE verb_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_verb_sessions" ON verb_sessions FOR ALL USING (auth.uid() = user_id);

-- MIGRATION: se já criou verb_sessions sem o campo details, execute:
-- ALTER TABLE verb_sessions ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';

-- MIGRATION: adicionar coluna tema nas sessões (tipo de problema estudado)
-- ALTER TABLE sessions ADD COLUMN IF NOT EXISTS tema TEXT;

-- MIGRATION: marcar se flashcard foi gerado de acerto ou erro
-- ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS correct BOOLEAN;

-- QUESTOES (registro individual de questões respondidas — enunciado + classificação)
CREATE TABLE questoes (
  id          TEXT PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ts          BIGINT NOT NULL,
  date        TEXT NOT NULL,
  disc        TEXT NOT NULL,
  mat         TEXT NOT NULL,
  banca       TEXT DEFAULT 'Não informada',
  enunciado   TEXT,
  correto     BOOLEAN NOT NULL DEFAULT false,
  error_type  TEXT,
  tema        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE questoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_questoes" ON questoes FOR ALL USING (auth.uid() = user_id);

-- USER PROFILES (nome público para o ranking competitivo)
-- MIGRATION: execute no SQL Editor do Supabase
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url   TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- Qualquer usuário autenticado pode ler perfis (necessário para o ranking)
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT USING (auth.uid() IS NOT NULL);
-- Cada usuário só escreve o próprio perfil
CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- MIGRATION: adicionar avatar_url se a tabela já existia sem ela
-- ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- RANKING FUNCTION: agrega stats de todos os usuários (SECURITY DEFINER bypassa RLS)
-- MIGRATION: execute no SQL Editor do Supabase
-- Se a função já existe sem avatar_url: DROP FUNCTION get_ranking(); antes de criar.
DROP FUNCTION IF EXISTS get_ranking();
CREATE FUNCTION get_ranking()
RETURNS TABLE (
  user_id         UUID,
  display_name    TEXT,
  avatar_url      TEXT,
  total_questions BIGINT,
  total_correct   BIGINT,
  accuracy        NUMERIC,
  sessions_count  BIGINT,
  big_goal        INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT
    s.user_id,
    COALESCE(NULLIF(p.display_name, ''), 'Sem nome')   AS display_name,
    p.avatar_url                                        AS avatar_url,
    COALESCE(SUM(s.total),   0)::BIGINT                AS total_questions,
    COALESCE(SUM(s.correct), 0)::BIGINT                AS total_correct,
    CASE WHEN SUM(s.total) > 0
      THEN ROUND(SUM(s.correct)::NUMERIC / SUM(s.total) * 100, 1)
      ELSE 0
    END                                                AS accuracy,
    COUNT(s.id)::BIGINT                                AS sessions_count,
    COALESCE(c.big_goal, 1000)                         AS big_goal
  FROM sessions s
  LEFT JOIN user_profiles p ON p.user_id = s.user_id
  LEFT JOIN user_config   c ON c.user_id = s.user_id
  GROUP BY s.user_id, p.display_name, p.avatar_url, c.big_goal
  ORDER BY total_questions DESC;
$func$;
