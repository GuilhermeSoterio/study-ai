import { createHashRouter, Navigate } from 'react-router-dom'
import App from '@/App'
import { Dashboard }  from '@/components/dashboard/Dashboard'
import { Flashcards } from '@/components/flashcards/Flashcards'
import { Personagem } from '@/components/personagem/Personagem'

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
      { path: 'registrar',  element: <Placeholder name="Registrar" /> },
      { path: 'analise',    element: <Placeholder name="Análise" /> },
      { path: 'historico',  element: <Placeholder name="Histórico" /> },
      { path: 'flashcards', element: <Flashcards /> },
      { path: 'materias',   element: <Placeholder name="Matérias" /> },
      { path: 'verbos',     element: <Placeholder name="Verbos" /> },
      { path: 'personagem', element: <Personagem /> },
      { path: '*',          element: <Navigate to="/dashboard" replace /> },
    ],
  },
])
