import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'
import { Header }       from '@/components/layout/Header'
import { Login }        from '@/components/layout/Login'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Toasts }       from '@/components/ui/Toast'

export default function App() {
  const userId  = useStore(s => s.userId)
  const loading = useStore(s => s.loading)
  const loadAll = useStore(s => s.loadAll)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') loadAll()
    })
    return () => subscription.unsubscribe()
  }, [loadAll])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="gradient-text text-2xl font-black animate-pulse">StudyBI</div>
      </div>
    )
  }

  if (!userId) return <Login />

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <main className="max-w-[1260px] mx-auto px-7 py-6">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Toasts />
    </div>
  )
}
