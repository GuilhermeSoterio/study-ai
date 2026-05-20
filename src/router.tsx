import { createHashRouter, Navigate } from 'react-router-dom'
import App from '@/App'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { NewAge }     from '@/components/newage/NewAge'
import { Dashboard }  from '@/components/dashboard/Dashboard'
import { Flashcards } from '@/components/flashcards/Flashcards'
import { RankCards }  from '@/components/rankcards/RankCards'
import { Historico }  from '@/components/historico/Historico'
import { Analise }    from '@/components/analise/Analise'
import { Materias }   from '@/components/materias/Materias'
import { PersonagemV2 } from '@/components/personagem/PersonagemV2'
import { Relatorio }    from '@/components/relatorio/Relatorio'
import { Diario }       from '@/components/diario/Diario'
import { Caderno }      from '@/components/notas/Caderno'
import { Patentes }     from '@/components/patentes/Patentes'
import { Leaderboard }  from '@/components/ranking/Leaderboard'
import { Foco }        from '@/components/foco/Foco'
import { Conceitos }   from '@/components/estudo/Conceitos'

export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true,        element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',  element: <Dashboard /> },
      { path: 'newage',     element: <NewAge /> },
      { path: 'analise',    element: <Analise /> },
      { path: 'historico',  element: <Historico /> },
      { path: 'flashcards', element: <Flashcards /> },
      { path: 'rankcards',  element: <RankCards /> },
      { path: 'materias',   element: <Materias /> },
      { path: 'personagem', element: <PersonagemV2 /> },
      { path: 'relatorio',     element: <Relatorio /> },
      { path: 'foco',          element: <Foco /> },
      { path: 'conceitos',     element: <Conceitos /> },
      { path: 'diario',        element: <Diario /> },
      { path: 'notas',         element: <Caderno /> },
      { path: 'patentes',         element: <Patentes /> },
      { path: 'ranking',          element: <Leaderboard /> },
      { path: 'loading-preview', element: <LoadingScreen /> },
      { path: '*',          element: <Navigate to="/dashboard" replace /> },
    ],
  },
])
