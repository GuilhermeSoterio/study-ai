import { useNavigate, useLocation } from 'react-router-dom'
import {
  House, BookOpen, ChartLineUp, Sword,
  SquaresFour, Sparkle, NotePencil, Notebook,
  MagnifyingGlass, CalendarBlank, ChartBar,
  Stack, BookBookmark, Medal, UserCircle,
  Sun, Moon, SignOut, Target, Trophy, Brain, Lightning,
  type Icon,
} from '@phosphor-icons/react'
import { useStore } from '@/store'
import { useTheme } from '@/hooks/useTheme'
import logoMini from '@/assets/logo-mini.png'

type NavItem = { path: string; label: string; Icon: Icon }
type Group   = { id: string; label: string; Icon: Icon; items: NavItem[] }

const GROUPS: Group[] = [
  {
    id: 'painel',
    label: 'Painel',
    Icon: House,
    items: [
      { path: '/dashboard', label: 'Dashboard', Icon: SquaresFour },
    ],
  },
  {
    id: 'estudo',
    label: 'Estudo',
    Icon: BookOpen,
    items: [
      { path: '/foco',      label: 'Modo Foco', Icon: Target    },
      { path: '/newage',    label: 'New Age',   Icon: Sparkle   },
      { path: '/conceitos', label: 'Conceitos', Icon: Brain     },
      { path: '/diario',    label: 'Diário',    Icon: NotePencil},
      { path: '/notas',     label: 'Caderno',   Icon: Notebook  },
    ],
  },
  {
    id: 'performance',
    label: 'Performance',
    Icon: ChartLineUp,
    items: [
      { path: '/analise',   label: 'Análise',   Icon: MagnifyingGlass },
      { path: '/historico', label: 'Histórico', Icon: CalendarBlank   },
      { path: '/relatorio', label: 'Relatório', Icon: ChartBar        },
    ],
  },
  {
    id: 'evolucao',
    label: 'Evolução',
    Icon: Sword,
    items: [
      { path: '/flashcards', label: 'Flashcards', Icon: Stack        },
      { path: '/rankcards',  label: 'EloCards',   Icon: Lightning    },
      { path: '/materias',   label: 'Matérias',   Icon: BookBookmark },
      { path: '/patentes',   label: 'Patentes',   Icon: Medal        },
      { path: '/ranking',    label: 'Ranking',    Icon: Trophy       },
      { path: '/personagem', label: 'Personagem', Icon: UserCircle   },
    ],
  },
]

export function Header() {
  const navigate         = useNavigate()
  const { pathname }     = useLocation()
  const signOut          = useStore(s => s.signOut)
  const { dark, toggle } = useTheme()

  const activeGroup = GROUPS.find(g => g.items.some(item => item.path === pathname)) ?? GROUPS[0]

  return (
    <aside className="flex shrink-0 sticky top-0 h-screen z-40">

      {/* ── Rail ─────────────────────────────────────────────── */}
      <div className="w-14 flex flex-col border-r border-border bg-surface">

        <div className="flex items-center justify-center py-3.5 shrink-0">
          <img src={logoMini} alt="New Age" className="h-6 w-auto" />
        </div>

        <div className="h-px bg-border mx-2 shrink-0" />

        <nav className="flex-1 flex flex-col gap-0.5 px-1.5 py-2 overflow-y-auto">
          {GROUPS.map(group => {
            const isActive = activeGroup.id === group.id
            return (
              <button
                key={group.id}
                onClick={() => { if (!isActive) navigate(group.items[0].path) }}
                className="flex flex-col items-center gap-1 w-full py-2.5 px-1 rounded-lg transition-all"
                style={isActive ? { background: 'rgba(74,124,89,0.15)' } : {}}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgb(var(--color-surface2))' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '' }}
              >
                <group.Icon
                  size={20}
                  weight={isActive ? 'fill' : 'regular'}
                  color={isActive ? '#4a7c59' : 'rgb(var(--color-muted))'}
                />
                <span
                  className="leading-tight text-center w-full select-none"
                  style={{ fontSize: '9px', color: isActive ? '#4a7c59' : 'rgb(var(--color-muted))' }}
                >
                  {group.label}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="h-px bg-border mx-2 shrink-0" />

        <div className="flex flex-col gap-1 px-1.5 py-2.5 shrink-0">
          <button
            onClick={toggle}
            className="flex items-center justify-center w-full h-9 rounded-lg border border-border text-muted hover:text-text hover:border-primary transition-all"
            title={dark ? 'Modo claro' : 'Modo escuro'}
          >
            {dark
              ? <Sun size={16} weight="fill" />
              : <Moon size={16} weight="fill" />
            }
          </button>
          <button
            onClick={signOut}
            className="flex items-center justify-center w-full h-9 rounded-lg border border-border text-muted hover:text-danger hover:border-danger/50 transition-all"
            title="Sair"
          >
            <SignOut size={16} weight="bold" />
          </button>
        </div>

      </div>

      {/* ── Second panel ─────────────────────────────────────── */}
      <div className="w-44 flex flex-col border-r border-border bg-surface2">

        <div className="flex items-center gap-2.5 px-4 py-4 shrink-0">
          <activeGroup.Icon size={18} weight="fill" color="#4a7c59" />
          <span className="text-sm font-bold text-text">{activeGroup.label}</span>
        </div>

        <div className="h-px bg-border mx-3 shrink-0" />

        <nav className="flex-1 flex flex-col gap-0.5 px-2 py-3 overflow-y-auto">
          {activeGroup.items.map(item => {
            const isActive = pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all"
                style={
                  isActive
                    ? { background: 'rgba(74,124,89,0.12)', color: '#4a7c59', fontWeight: 600 }
                    : { color: 'rgb(var(--color-muted))' }
                }
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgb(var(--color-surface3))' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '' }}
              >
                <item.Icon
                  size={16}
                  weight={isActive ? 'fill' : 'regular'}
                  color={isActive ? '#4a7c59' : 'rgb(var(--color-muted))'}
                  className="shrink-0"
                />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && (
                  <span className="text-xs shrink-0" style={{ color: '#4a7c59' }}>›</span>
                )}
              </button>
            )
          })}
        </nav>

      </div>

    </aside>
  )
}
