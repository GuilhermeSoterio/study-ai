import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'
import { setBackendToken } from '@/lib/backendApi'
import { Header }          from '@/components/layout/Header'
import { Login }           from '@/components/layout/Login'
import { TopMatsSidebar }  from '@/components/layout/TopMatsSidebar'
import { ErrorBoundary }   from '@/components/ui/ErrorBoundary'
import { Toasts }          from '@/components/ui/Toast'
import { LoadingScreen }   from '@/components/ui/LoadingScreen'

export default function App() {
  const userId  = useStore(s => s.userId)
  const loading = useStore(s => s.loading)
  const loadAll = useStore(s => s.loadAll)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setBackendToken(session?.access_token ?? null)
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') loadAll()
    })
    return () => subscription.unsubscribe()
  }, [loadAll])

  if (loading) return <LoadingScreen />

  if (!userId) return <Login />

  return (
    <div className="flex min-h-screen bg-bg">
      <Header />
      <div className="flex-1 min-w-0 flex md:gap-5 items-start px-3 py-4 pb-20 md:px-8 md:py-6 md:pb-6">
        <main className="flex-1 min-w-0 w-full">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        <aside className="hidden xl:block w-[200px] shrink-0 sticky top-6 max-h-[calc(100vh-48px)] overflow-y-auto pb-6">
          <TopMatsSidebar />
        </aside>
      </div>
      <Toasts />
    </div>
  )
}
