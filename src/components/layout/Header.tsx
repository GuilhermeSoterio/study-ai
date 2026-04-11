import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '@/store'

const TABS = [
  { path: '/dashboard',  label: 'Dashboard' },
  { path: '/registrar',  label: '＋ Registrar' },
  { path: '/analise',    label: 'Análise' },
  { path: '/historico',  label: 'Histórico' },
  { path: '/flashcards', label: '📇 Flashcards' },
  { path: '/materias',   label: '📋 Matérias' },
  { path: '/verbos',     label: '🔤 Verbos' },
  { path: '/personagem', label: '⚔️ Personagem' },
]

export function Header() {
  const navigate  = useNavigate()
  const { pathname } = useLocation()
  const signOut   = useStore(s => s.signOut)

  return (
    <header className="sticky top-0 z-50 bg-bg/94 backdrop-blur-xl border-b border-border px-7 h-[60px] flex items-center justify-between gap-4">
      <div className="gradient-text text-[17px] font-black tracking-tight whitespace-nowrap">
        StudyBI
      </div>

      <nav className="flex gap-0.5 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`px-3.5 py-1.5 rounded-sm text-[13px] font-semibold transition-all whitespace-nowrap ${
              pathname === tab.path
                ? 'bg-gradient-to-r from-primary to-cyan-600 text-white'
                : 'text-muted hover:bg-surface2 hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <button
        onClick={signOut}
        className="bg-surface2 border border-border text-muted w-9 h-9 rounded-sm flex items-center justify-center hover:text-text hover:border-primary2 transition-all text-base shrink-0"
        title="Sair"
      >
        ↩
      </button>
    </header>
  )
}
