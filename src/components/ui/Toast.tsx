import { useToastStore, type Toast } from '@/store/toastStore'

const ICONS: Record<Toast['type'], string> = {
  error:   '✕',
  success: '✓',
  info:    'i',
}

const STYLES: Record<Toast['type'], { wrap: string; icon: string }> = {
  error:   { wrap: 'border-danger/40 bg-surface',  icon: 'bg-danger/20 text-danger' },
  success: { wrap: 'border-success/40 bg-surface', icon: 'bg-success/20 text-success' },
  info:    { wrap: 'border-border bg-surface',     icon: 'bg-accent/20 text-accent' },
}

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore(s => s.removeToast)
  const s = STYLES[toast.type]

  return (
    <div className={`flex items-start gap-3 w-80 border rounded-card px-4 py-3 shadow-xl shadow-black/40
      transition-all duration-300 ${s.wrap}`}
      style={{ animation: 'toast-in 0.25s ease-out' }}
    >
      <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5 ${s.icon}`}>
        {ICONS[toast.type]}
      </span>
      <p className="flex-1 text-[13px] text-text leading-snug">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-dim hover:text-muted transition-colors text-lg leading-none mt-0.5"
      >
        ×
      </button>
    </div>
  )
}

export function Toasts() {
  const toasts = useToastStore(s => s.toasts)
  if (!toasts.length) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end">
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  )
}
