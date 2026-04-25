-- Seed da Skill Tree
-- Gerado a partir de src/lib/skillTreeData.ts
-- type: "discipline" = nó raiz (sem mat), "subject" = matéria (com mat)
-- Rode no Supabase SQL Editor ou via psql

INSERT INTO skill_tree (data, version) VALUES ($$
[
  {
    "id": "fonetica",
    "label": "Fonética",
    "type": "discipline",
    "disc": "Fonética",
    "icon": "Aα",
    "children": [
      { "id": "fonologia",  "label": "Fonologia",  "type": "subject", "disc": "Fonética", "mat": "Fonologia",  "children": [] },
      { "id": "ortografia", "label": "Ortografia", "type": "subject", "disc": "Fonética", "mat": "Ortografia", "children": [] },
      { "id": "acentuacao", "label": "Acentuação", "type": "subject", "disc": "Fonética", "mat": "Acentuação", "children": [] }
    ]
  },
  {
    "id": "morfologia",
    "label": "Morfologia",
    "type": "discipline",
    "disc": "Morfologia",
    "icon": "⚔️",
    "children": [
      { "id": "estrutura-pal", "label": "Estrutura das Palavras", "type": "subject", "disc": "Morfologia", "mat": "Estrutura das Palavras", "children": [] },
      {
        "id": "classes-morf",
        "label": "Classes Morfológicas",
        "type": "subject",
        "disc": "Morfologia",
        "mat": "Classes Morfológicas",
        "children": [
          { "id": "substantivo",   "label": "Substantivo",  "type": "subject", "disc": "Morfologia", "mat": "Substantivo",  "children": [] },
          { "id": "adjetivo",      "label": "Adjetivo",     "type": "subject", "disc": "Morfologia", "mat": "Adjetivo",     "children": [] },
          {
            "id": "verbo",
            "label": "Verbo",
            "type": "subject",
            "disc": "Morfologia",
            "mat": "Verbo",
            "children": [
              { "id": "tempos-modos", "label": "Tempos e Modos Verbais", "type": "subject", "disc": "Morfologia", "mat": "Tempos e Modos Verbais", "children": [] }
            ]
          },
          { "id": "artigo",      "label": "Artigo",      "type": "subject", "disc": "Morfologia", "mat": "Artigo",      "children": [] },
          {
            "id": "pronome",
            "label": "Pronome",
            "type": "subject",
            "disc": "Morfologia",
            "mat": "Pronome",
            "children": [
              { "id": "colocacao-pron", "label": "Colocação Pronominal", "type": "subject", "disc": "Morfologia", "mat": "Colocação Pronominal", "children": [] }
            ]
          },
          { "id": "adverbio",    "label": "Advérbio",    "type": "subject", "disc": "Morfologia", "mat": "Advérbio",    "children": [] },
          { "id": "preposicao",  "label": "Preposição",  "type": "subject", "disc": "Morfologia", "mat": "Preposição",  "children": [] },
          { "id": "conjuncao",   "label": "Conjunção",   "type": "subject", "disc": "Morfologia", "mat": "Conjunção",   "children": [] },
          { "id": "numeral",     "label": "Numeral",     "type": "subject", "disc": "Morfologia", "mat": "Numeral",     "children": [] },
          { "id": "interjeicao", "label": "Interjeição", "type": "subject", "disc": "Morfologia", "mat": "Interjeição", "children": [] }
        ]
      }
    ]
  },
  {
    "id": "sintaxe",
    "label": "Sintaxe",
    "type": "discipline",
    "disc": "Sintaxe",
    "icon": "🔗",
    "children": [
      { "id": "termos-oracao", "label": "Termos da Oração",      "type": "subject", "disc": "Sintaxe", "mat": "Termos da Oração",      "children": [] },
      {
        "id": "coord",
        "label": "Coordenação",
        "type": "subject",
        "disc": "Sintaxe",
        "mat": "Coordenação",
        "children": [
          {
            "id": "subord",
            "label": "Subordinação",
            "type": "subject",
            "disc": "Sintaxe",
            "mat": "Subordinação",
            "children": [
              { "id": "periodo-comp", "label": "Período Composto", "type": "subject", "disc": "Sintaxe", "mat": "Período Composto", "children": [] }
            ]
          }
        ]
      },
      { "id": "conc-verbal",  "label": "Concordância Verbal",  "type": "subject", "disc": "Sintaxe", "mat": "Concordância Verbal",  "children": [] },
      { "id": "conc-nominal", "label": "Concordância Nominal", "type": "subject", "disc": "Sintaxe", "mat": "Concordância Nominal", "children": [] },
      { "id": "reg-verbal",   "label": "Regência Verbal",      "type": "subject", "disc": "Sintaxe", "mat": "Regência Verbal",      "children": [] },
      { "id": "reg-nominal",  "label": "Regência Nominal",     "type": "subject", "disc": "Sintaxe", "mat": "Regência Nominal",     "children": [] },
      { "id": "crase",        "label": "Crase",                "type": "subject", "disc": "Sintaxe", "mat": "Crase",                "children": [] },
      { "id": "pontuacao",    "label": "Pontuação",            "type": "subject", "disc": "Sintaxe", "mat": "Pontuação",            "children": [] }
    ]
  },
  {
    "id": "estilistica",
    "label": "Estilística",
    "type": "discipline",
    "disc": "Estilística",
    "icon": "✍️",
    "children": [
      {
        "id": "semantica",
        "label": "Semântica",
        "type": "subject",
        "disc": "Estilística",
        "mat": "Semântica",
        "children": [
          { "id": "sinonimos",    "label": "Sinônimos",                "type": "subject", "disc": "Estilística", "mat": "Sinônimos",                "children": [] },
          { "id": "significacao", "label": "Significação das Palavras", "type": "subject", "disc": "Estilística", "mat": "Significação das Palavras", "children": [] }
        ]
      },
      { "id": "figuras", "label": "Figuras de Linguagem", "type": "subject", "disc": "Estilística", "mat": "Figuras de Linguagem", "children": [] },
      {
        "id": "conectivos",
        "label": "Conectivos",
        "type": "subject",
        "disc": "Estilística",
        "mat": "Conectivos",
        "children": [
          { "id": "troca-conect", "label": "Troca de Conectivos",   "type": "subject", "disc": "Estilística", "mat": "Troca de Conectivos",   "children": [] },
          { "id": "conectores",   "label": "Conectores de Coesão",  "type": "subject", "disc": "Estilística", "mat": "Conectores de Coesão",  "children": [] }
        ]
      },
      {
        "id": "mec-coesao",
        "label": "Mecanismos de Coesão",
        "type": "subject",
        "disc": "Estilística",
        "mat": "Mecanismos de Coesão",
        "children": [
          { "id": "referenciacao", "label": "Referenciação e Substituição", "type": "subject", "disc": "Estilística", "mat": "Referenciação e Substituição", "children": [] }
        ]
      }
    ]
  },
  {
    "id": "interpretacao",
    "label": "Interpretação de Texto",
    "type": "discipline",
    "disc": "Interpretação de Texto",
    "icon": "📖",
    "children": [
      { "id": "interp-txt",  "label": "Interpretação de Texto", "type": "subject", "disc": "Interpretação de Texto", "mat": "Interpretação de Texto", "children": [] },
      { "id": "tipologia",   "label": "Tipologia Textual",      "type": "subject", "disc": "Interpretação de Texto", "mat": "Tipologia Textual",      "children": [] },
      {
        "id": "generos-txt",
        "label": "Gêneros Textuais",
        "type": "subject",
        "disc": "Interpretação de Texto",
        "mat": "Gêneros Textuais",
        "children": [
          { "id": "reescrita-gen", "label": "Reescrita de Gêneros", "type": "subject", "disc": "Interpretação de Texto", "mat": "Reescrita de Gêneros", "children": [] }
        ]
      },
      { "id": "coesao-coer", "label": "Coesão e Coerência", "type": "subject", "disc": "Interpretação de Texto", "mat": "Coesão e Coerência", "children": [] },
      {
        "id": "reescrita",
        "label": "Reescrita e Equivalência",
        "type": "subject",
        "disc": "Interpretação de Texto",
        "mat": "Reescrita e Equivalência",
        "children": [
          { "id": "subst-reorg", "label": "Substituição e Reorganização", "type": "subject", "disc": "Interpretação de Texto", "mat": "Substituição e Reorganização", "children": [] }
        ]
      },
      {
        "id": "redacao-of",
        "label": "Redação Oficial",
        "type": "subject",
        "disc": "Interpretação de Texto",
        "mat": "Redação Oficial",
        "children": [
          { "id": "manual-tcdf", "label": "Manual Redação TCDF", "type": "subject", "disc": "Interpretação de Texto", "mat": "Manual de Redação TCDF", "children": [] }
        ]
      }
    ]
  },
  {
    "id": "ti",
    "label": "Tecnologia da Informação",
    "type": "discipline",
    "disc": "Tecnologia da Informação",
    "icon": "💻",
    "children": [
      {
        "id": "bd",
        "label": "Banco de Dados",
        "type": "subject",
        "disc": "Tecnologia da Informação",
        "mat": "Banco de Dados",
        "children": [
          { "id": "sql", "label": "SQL", "type": "subject", "disc": "Tecnologia da Informação", "mat": "SQL", "children": [] }
        ]
      },
      {
        "id": "redes",
        "label": "Redes de Computadores",
        "type": "subject",
        "disc": "Tecnologia da Informação",
        "mat": "Redes de Computadores",
        "children": [
          { "id": "seg-info", "label": "Segurança da Informação", "type": "subject", "disc": "Tecnologia da Informação", "mat": "Segurança da Informação", "children": [] }
        ]
      },
      {
        "id": "eng-soft",
        "label": "Engenharia de Software",
        "type": "subject",
        "disc": "Tecnologia da Informação",
        "mat": "Engenharia de Software",
        "children": [
          { "id": "dev-soft", "label": "Desenvolvimento de Software", "type": "subject", "disc": "Tecnologia da Informação", "mat": "Desenvolvimento de Software", "children": [] }
        ]
      },
      {
        "id": "so",
        "label": "Sistemas Operacionais",
        "type": "subject",
        "disc": "Tecnologia da Informação",
        "mat": "Sistemas Operacionais",
        "children": [
          { "id": "arq-comp", "label": "Arquitetura de Computadores", "type": "subject", "disc": "Tecnologia da Informação", "mat": "Arquitetura de Computadores", "children": [] }
        ]
      },
      {
        "id": "gov-ti",
        "label": "Governança de TI",
        "type": "subject",
        "disc": "Tecnologia da Informação",
        "mat": "Governança de TI",
        "children": [
          { "id": "itil", "label": "ITIL / COBIT", "type": "subject", "disc": "Tecnologia da Informação", "mat": "ITIL / COBIT", "children": [] }
        ]
      }
    ]
  },
  {
    "id": "logica",
    "label": "Raciocínio Lógico",
    "type": "discipline",
    "disc": "Raciocínio Lógico",
    "icon": "🧠",
    "children": [
      {
        "id": "logica-prop",
        "label": "Lógica Proposicional",
        "type": "subject",
        "disc": "Raciocínio Lógico",
        "mat": "Lógica Proposicional",
        "children": [
          { "id": "logica-arg", "label": "Lógica de Argumentação", "type": "subject", "disc": "Raciocínio Lógico", "mat": "Lógica de Argumentação", "children": [] }
        ]
      },
      {
        "id": "rac-quant",
        "label": "Raciocínio Quantitativo",
        "type": "subject",
        "disc": "Raciocínio Lógico",
        "mat": "Raciocínio Quantitativo",
        "children": [
          { "id": "seq-pad", "label": "Sequências e Padrões",       "type": "subject", "disc": "Raciocínio Lógico", "mat": "Sequências e Padrões",       "children": [] },
          { "id": "comb",    "label": "Análise Combinatória",        "type": "subject", "disc": "Raciocínio Lógico", "mat": "Análise Combinatória",        "children": [] },
          { "id": "prob",    "label": "Probabilidade e Estatística", "type": "subject", "disc": "Raciocínio Lógico", "mat": "Probabilidade e Estatística", "children": [] }
        ]
      }
    ]
  },
  {
    "id": "dir-const",
    "label": "Direito Constitucional",
    "type": "discipline",
    "disc": "Direito Constitucional",
    "icon": "⚖️",
    "children": [
      { "id": "princ-fund", "label": "Princípios Fundamentais", "type": "subject", "disc": "Direito Constitucional", "mat": "Princípios Fundamentais", "children": [] },
      { "id": "dir-gar",    "label": "Direitos e Garantias",    "type": "subject", "disc": "Direito Constitucional", "mat": "Direitos e Garantias",    "children": [] },
      {
        "id": "org-estado",
        "label": "Organização do Estado",
        "type": "subject",
        "disc": "Direito Constitucional",
        "mat": "Organização do Estado",
        "children": [
          { "id": "poder-jud",  "label": "Poder Judiciário",               "type": "subject", "disc": "Direito Constitucional", "mat": "Poder Judiciário",               "children": [] },
          { "id": "ctrl-const", "label": "Controle de Constitucionalidade", "type": "subject", "disc": "Direito Constitucional", "mat": "Controle de Constitucionalidade", "children": [] }
        ]
      }
    ]
  },
  {
    "id": "dir-adm",
    "label": "Direito Administrativo",
    "type": "discipline",
    "disc": "Direito Administrativo",
    "icon": "📋",
    "children": [
      { "id": "princ-adm",  "label": "Princípios da Administração",     "type": "subject", "disc": "Direito Administrativo", "mat": "Princípios da Administração",     "children": [] },
      { "id": "atos-adm",   "label": "Atos Administrativos",            "type": "subject", "disc": "Direito Administrativo", "mat": "Atos Administrativos",            "children": [] },
      { "id": "licit",      "label": "Licitações e Contratos",          "type": "subject", "disc": "Direito Administrativo", "mat": "Licitações e Contratos",          "children": [] },
      { "id": "agentes",    "label": "Agentes Públicos",                "type": "subject", "disc": "Direito Administrativo", "mat": "Agentes Públicos",                "children": [] },
      { "id": "ctrl-adm",   "label": "Controle da Administração",       "type": "subject", "disc": "Direito Administrativo", "mat": "Controle da Administração",       "children": [] },
      { "id": "resp-civil", "label": "Responsabilidade Civil do Estado", "type": "subject", "disc": "Direito Administrativo", "mat": "Responsabilidade Civil do Estado", "children": [] }
    ]
  }
]
$$::jsonb, 1);
