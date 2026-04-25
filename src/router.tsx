import { createHashRouter, Navigate } from 'react-router-dom'
import App from '@/App'
import { Dashboard }  from '@/components/dashboard/Dashboard'
import { Flashcards } from '@/components/flashcards/Flashcards'
import { Historico }  from '@/components/historico/Historico'
import { Analise }    from '@/components/analise/Analise'
import { Materias }   from '@/components/materias/Materias'
import { PersonagemV2 } from '@/components/personagem/PersonagemV2'
import { Relatorio }    from '@/components/relatorio/Relatorio'
import { Registrar }    from '@/components/registrar/Registrar'
import { Diario }       from '@/components/diario/Diario'

const Placeholder = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center h-64 text-muted text-sm">
    {name} — em migração
  </div>
)

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true,        element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',  element: <Dashboard /> },
      { path: 'registrar',  element: <Registrar /> },
      { path: 'analise',    element: <Analise /> },
      { path: 'historico',  element: <Historico /> },
      { path: 'flashcards', element: <Flashcards /> },
      { path: 'materias',   element: <Materias /> },
      { path: 'verbos',     element: <Placeholder name="Verbos" /> },
      { path: 'personagem', element: <PersonagemV2 /> },
      { path: 'relatorio',     element: <Relatorio /> },
      { path: 'diario',        element: <Diario /> },
      { path: '*',          element: <Navigate to="/dashboard" replace /> },
    ],
  },
])
