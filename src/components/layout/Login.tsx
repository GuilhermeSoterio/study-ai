import { useState } from 'react'
import { useStore } from '@/store'

export function Login() {
  const signIn = useStore(s => s.signIn)
  const loadAll = useStore(s => s.loadAll)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const err = await signIn(email, password)
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      await loadAll()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="bg-surface border border-border rounded-card p-8 w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="gradient-text text-3xl font-black mb-1">StudyBI</div>
          <div className="text-muted text-sm">Tribunais TI</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary2"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary2"
              required
            />
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-cyan-600 text-white font-bold py-2.5 rounded-sm disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
