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
