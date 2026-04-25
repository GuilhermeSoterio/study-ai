import type { TNode } from './types'

export const SKILL_FOREST: TNode[] = [
  {
    id: 'fonetica', label: 'Fonética', disc: 'Fonética', icon: 'Aα',
    children: [
      { id: 'fonologia',  label: 'Fonologia',  disc: 'Fonética', mat: 'Fonologia' },
      { id: 'ortografia', label: 'Ortografia', disc: 'Fonética', mat: 'Ortografia' },
      { id: 'acentuacao', label: 'Acentuação', disc: 'Fonética', mat: 'Acentuação' },
    ],
  },
  {
    id: 'morfologia', label: 'Morfologia', disc: 'Morfologia', icon: '⚔️',
    children: [
      { id: 'estrutura-pal', label: 'Estrutura das Palavras', disc: 'Morfologia', mat: 'Estrutura das Palavras' },
      {
        id: 'classes-morf', label: 'Classes Morfológicas', disc: 'Morfologia', mat: 'Classes Morfológicas',
        children: [
          { id: 'substantivo', label: 'Substantivo',  disc: 'Morfologia', mat: 'Substantivo' },
          { id: 'adjetivo',    label: 'Adjetivo',     disc: 'Morfologia', mat: 'Adjetivo' },
          {
            id: 'verbo', label: 'Verbo', disc: 'Morfologia', mat: 'Verbo',
            children: [
              { id: 'tempos-modos', label: 'Tempos e Modos Verbais', disc: 'Morfologia', mat: 'Tempos e Modos Verbais' },
            ],
          },
          { id: 'artigo',      label: 'Artigo',       disc: 'Morfologia', mat: 'Artigo' },
          {
            id: 'pronome', label: 'Pronome', disc: 'Morfologia', mat: 'Pronome',
            children: [
              { id: 'colocacao-pron', label: 'Colocação Pronominal', disc: 'Morfologia', mat: 'Colocação Pronominal' },
            ],
          },
          { id: 'adverbio',    label: 'Advérbio',     disc: 'Morfologia', mat: 'Advérbio' },
          { id: 'preposicao',  label: 'Preposição',   disc: 'Morfologia', mat: 'Preposição' },
          { id: 'conjuncao',   label: 'Conjunção',    disc: 'Morfologia', mat: 'Conjunção' },
          { id: 'numeral',     label: 'Numeral',      disc: 'Morfologia', mat: 'Numeral' },
          { id: 'interjeicao', label: 'Interjeição',  disc: 'Morfologia', mat: 'Interjeição' },
        ],
      },
    ],
  },
  {
    id: 'sintaxe', label: 'Sintaxe', disc: 'Sintaxe', icon: '🔗',
    children: [
      { id: 'termos-oracao', label: 'Termos da Oração',      disc: 'Sintaxe', mat: 'Termos da Oração' },
      {
        id: 'coord', label: 'Coordenação', disc: 'Sintaxe', mat: 'Coordenação',
        children: [
          {
            id: 'subord', label: 'Subordinação', disc: 'Sintaxe', mat: 'Subordinação',
            children: [
              { id: 'periodo-comp', label: 'Período Composto', disc: 'Sintaxe', mat: 'Período Composto' },
            ],
          },
        ],
      },
      { id: 'conc-verbal',  label: 'Concordância Verbal',  disc: 'Sintaxe', mat: 'Concordância Verbal' },
      { id: 'conc-nominal', label: 'Concordância Nominal', disc: 'Sintaxe', mat: 'Concordância Nominal' },
      { id: 'reg-verbal',   label: 'Regência Verbal',      disc: 'Sintaxe', mat: 'Regência Verbal' },
      { id: 'reg-nominal',  label: 'Regência Nominal',     disc: 'Sintaxe', mat: 'Regência Nominal' },
      { id: 'crase',        label: 'Crase',                disc: 'Sintaxe', mat: 'Crase' },
      { id: 'pontuacao',    label: 'Pontuação',            disc: 'Sintaxe', mat: 'Pontuação' },
    ],
  },
  {
    id: 'estilistica', label: 'Estilística', disc: 'Estilística', icon: '✍️',
    children: [
      {
        id: 'semantica', label: 'Semântica', disc: 'Estilística', mat: 'Semântica',
        children: [
          { id: 'sinonimos',    label: 'Sinônimos',               disc: 'Estilística', mat: 'Sinônimos' },
          { id: 'significacao', label: 'Significação das Palavras', disc: 'Estilística', mat: 'Significação das Palavras' },
        ],
      },
      { id: 'figuras', label: 'Figuras de Linguagem', disc: 'Estilística', mat: 'Figuras de Linguagem' },
      {
        id: 'conectivos', label: 'Conectivos', disc: 'Estilística', mat: 'Conectivos',
        children: [
          { id: 'troca-conect', label: 'Troca de Conectivos', disc: 'Estilística', mat: 'Troca de Conectivos' },
          { id: 'conectores',   label: 'Conectores de Coesão', disc: 'Estilística', mat: 'Conectores de Coesão' },
        ],
      },
      {
        id: 'mec-coesao', label: 'Mecanismos de Coesão', disc: 'Estilística', mat: 'Mecanismos de Coesão',
        children: [
          { id: 'referenciacao', label: 'Referenciação e Substituição', disc: 'Estilística', mat: 'Referenciação e Substituição' },
        ],
      },
    ],
  },
  {
    id: 'interpretacao', label: 'Interpretação de Texto', disc: 'Interpretação de Texto', icon: '📖',
    children: [
      { id: 'interp-txt',  label: 'Interpretação de Texto', disc: 'Interpretação de Texto', mat: 'Interpretação de Texto' },
      { id: 'tipologia',   label: 'Tipologia Textual',      disc: 'Interpretação de Texto', mat: 'Tipologia Textual' },
      {
        id: 'generos-txt', label: 'Gêneros Textuais', disc: 'Interpretação de Texto', mat: 'Gêneros Textuais',
        children: [
          { id: 'reescrita-gen', label: 'Reescrita de Gêneros', disc: 'Interpretação de Texto', mat: 'Reescrita de Gêneros' },
        ],
      },
      { id: 'coesao-coer', label: 'Coesão e Coerência', disc: 'Interpretação de Texto', mat: 'Coesão e Coerência' },
      {
        id: 'reescrita', label: 'Reescrita e Equivalência', disc: 'Interpretação de Texto', mat: 'Reescrita e Equivalência',
        children: [
          { id: 'subst-reorg', label: 'Substituição e Reorganização', disc: 'Interpretação de Texto', mat: 'Substituição e Reorganização' },
        ],
      },
      {
        id: 'redacao-of', label: 'Redação Oficial', disc: 'Interpretação de Texto', mat: 'Redação Oficial',
        children: [
          { id: 'manual-tcdf', label: 'Manual Redação TCDF', disc: 'Interpretação de Texto', mat: 'Manual de Redação TCDF' },
        ],
      },
    ],
  },
  {
    id: 'ti', label: 'Tecnologia da Informação', disc: 'Tecnologia da Informação', icon: '💻',
    children: [
      {
        id: 'bd', label: 'Banco de Dados', disc: 'Tecnologia da Informação', mat: 'Banco de Dados',
        children: [{ id: 'sql', label: 'SQL', disc: 'Tecnologia da Informação', mat: 'SQL' }],
      },
      {
        id: 'redes', label: 'Redes de Computadores', disc: 'Tecnologia da Informação', mat: 'Redes de Computadores',
        children: [{ id: 'seg-info', label: 'Segurança da Informação', disc: 'Tecnologia da Informação', mat: 'Segurança da Informação' }],
      },
      {
        id: 'eng-soft', label: 'Engenharia de Software', disc: 'Tecnologia da Informação', mat: 'Engenharia de Software',
        children: [{ id: 'dev-soft', label: 'Desenvolvimento de Software', disc: 'Tecnologia da Informação', mat: 'Desenvolvimento de Software' }],
      },
      {
        id: 'so', label: 'Sistemas Operacionais', disc: 'Tecnologia da Informação', mat: 'Sistemas Operacionais',
        children: [{ id: 'arq-comp', label: 'Arquitetura de Computadores', disc: 'Tecnologia da Informação', mat: 'Arquitetura de Computadores' }],
      },
      {
        id: 'gov-ti', label: 'Governança de TI', disc: 'Tecnologia da Informação', mat: 'Governança de TI',
        children: [{ id: 'itil', label: 'ITIL / COBIT', disc: 'Tecnologia da Informação', mat: 'ITIL / COBIT' }],
      },
    ],
  },
  {
    id: 'logica', label: 'Raciocínio Lógico', disc: 'Raciocínio Lógico', icon: '🧠',
    children: [
      {
        id: 'logica-prop', label: 'Lógica Proposicional', disc: 'Raciocínio Lógico', mat: 'Lógica Proposicional',
        children: [{ id: 'logica-arg', label: 'Lógica de Argumentação', disc: 'Raciocínio Lógico', mat: 'Lógica de Argumentação' }],
      },
      {
        id: 'rac-quant', label: 'Raciocínio Quantitativo', disc: 'Raciocínio Lógico', mat: 'Raciocínio Quantitativo',
        children: [
          { id: 'seq-pad', label: 'Sequências e Padrões',       disc: 'Raciocínio Lógico', mat: 'Sequências e Padrões' },
          { id: 'comb',    label: 'Análise Combinatória',        disc: 'Raciocínio Lógico', mat: 'Análise Combinatória' },
          { id: 'prob',    label: 'Probabilidade e Estatística', disc: 'Raciocínio Lógico', mat: 'Probabilidade e Estatística' },
        ],
      },
    ],
  },
  {
    id: 'dir-const', label: 'Direito Constitucional', disc: 'Direito Constitucional', icon: '⚖️',
    children: [
      { id: 'princ-fund', label: 'Princípios Fundamentais', disc: 'Direito Constitucional', mat: 'Princípios Fundamentais' },
      { id: 'dir-gar',    label: 'Direitos e Garantias',    disc: 'Direito Constitucional', mat: 'Direitos e Garantias' },
      {
        id: 'org-estado', label: 'Organização do Estado', disc: 'Direito Constitucional', mat: 'Organização do Estado',
        children: [
          { id: 'poder-jud',     label: 'Poder Judiciário',               disc: 'Direito Constitucional', mat: 'Poder Judiciário' },
          { id: 'ctrl-const',    label: 'Controle de Constitucionalidade', disc: 'Direito Constitucional', mat: 'Controle de Constitucionalidade' },
        ],
      },
    ],
  },
  {
    id: 'dir-adm', label: 'Direito Administrativo', disc: 'Direito Administrativo', icon: '📋',
    children: [
      { id: 'princ-adm',  label: 'Princípios da Administração',    disc: 'Direito Administrativo', mat: 'Princípios da Administração' },
      { id: 'atos-adm',   label: 'Atos Administrativos',           disc: 'Direito Administrativo', mat: 'Atos Administrativos' },
      { id: 'licit',      label: 'Licitações e Contratos',         disc: 'Direito Administrativo', mat: 'Licitações e Contratos' },
      { id: 'agentes',    label: 'Agentes Públicos',               disc: 'Direito Administrativo', mat: 'Agentes Públicos' },
      { id: 'ctrl-adm',   label: 'Controle da Administração',      disc: 'Direito Administrativo', mat: 'Controle da Administração' },
      { id: 'resp-civil', label: 'Responsabilidade Civil do Estado', disc: 'Direito Administrativo', mat: 'Responsabilidade Civil do Estado' },
    ],
  },
]