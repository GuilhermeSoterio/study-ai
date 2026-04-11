import type { UserConfig } from '@/types'

export const DEFAULT_CONFIG: UserConfig = {
  user_id: '',
  daily: 30,
  big_goal: 1000,
  weekly: 200,
  monthly: 500,
}

export const DEFAULT_DISC: Record<string, string[]> = {
  'Fonética': ['Fonologia', 'Ortografia', 'Acentuação'],
  'Morfologia': [
    'Estrutura das Palavras', 'Classes Morfológicas',
    'Substantivo', 'Adjetivo', 'Verbo', 'Tempos e Modos Verbais',
    'Artigo', 'Pronome', 'Advérbio', 'Preposição', 'Conjunção',
    'Numeral', 'Interjeição', 'Colocação Pronominal',
  ],
  'Sintaxe': [
    'Termos da Oração', 'Coordenação', 'Subordinação', 'Período Composto',
    'Concordância Verbal', 'Concordância Nominal',
    'Regência Verbal', 'Regência Nominal', 'Crase', 'Pontuação',
  ],
  'Estilística': [
    'Semântica', 'Sinônimos', 'Figuras de Linguagem',
    'Conectivos', 'Troca de Conectivos', 'Significação das Palavras',
    'Mecanismos de Coesão', 'Referenciação e Substituição', 'Conectores de Coesão',
  ],
  'Interpretação de Texto': [
    'Interpretação de Texto', 'Tipologia Textual', 'Gêneros Textuais',
    'Coesão e Coerência', 'Reescrita e Equivalência',
    'Substituição e Reorganização', 'Reescrita de Gêneros',
    'Redação Oficial', 'Manual de Redação TCDF',
  ],
  'Tecnologia da Informação': [
    'Banco de Dados', 'SQL', 'Redes de Computadores', 'Segurança da Informação',
    'Engenharia de Software', 'Sistemas Operacionais', 'Arquitetura de Computadores',
    'Governança de TI', 'ITIL / COBIT', 'Desenvolvimento de Software',
  ],
  'Raciocínio Lógico': [
    'Lógica Proposicional', 'Raciocínio Quantitativo', 'Sequências e Padrões',
    'Lógica de Argumentação', 'Probabilidade e Estatística', 'Análise Combinatória',
  ],
  'Direito Constitucional': [
    'Princípios Fundamentais', 'Direitos e Garantias',
    'Organização do Estado', 'Poder Judiciário', 'Controle de Constitucionalidade',
  ],
  'Direito Administrativo': [
    'Princípios da Administração', 'Atos Administrativos', 'Licitações e Contratos',
    'Agentes Públicos', 'Controle da Administração', 'Responsabilidade Civil do Estado',
  ],
}

export const DEFAULT_BANCAS = [
  'FGV', 'CESPE / CEBRASPE', 'FCC', 'VUNESP', 'ESAF',
  'CESGRANRIO', 'IADES', 'QUADRIX', 'AOCP', 'Não informada',
]
