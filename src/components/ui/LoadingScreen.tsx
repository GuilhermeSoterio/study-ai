import logo from '@/assets/logo.png'

export function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 bg-bg"
      style={{ animation: 'splash-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
    >
      {/* Logo + anel giratório */}
      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>

        {/* Anel externo: arco girando em gradiente de marca */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, transparent 0%, transparent 40%, #4a7c59 55%, #d4a017 75%, transparent 88%, transparent 100%)',
            animation: 'logo-ring 2.8s linear infinite',
          }}
        />

        {/* Máscara interna que cria a aparência de borda */}
        <div
          style={{
            position: 'absolute',
            inset: 10,
            borderRadius: '50%',
            background: 'rgb(var(--color-bg))',
          }}
        />

        {/* Logo flutuando com glow pulsante */}
        <img
          src={logo}
          alt="New Age"
          style={{
            position: 'relative',
            zIndex: 1,
            width: 110,
            height: 'auto',
            animation: 'logo-float 3.2s ease-in-out infinite, logo-glow 3.2s ease-in-out infinite',
          }}
        />
      </div>

      {/* Nome e subtítulo */}
      <div className="text-center space-y-1" style={{ animation: 'splash-in 0.7s 0.15s ease forwards', opacity: 0 }}>
        <div className="gradient-text text-2xl font-black tracking-tight">New Age</div>
        <div className="text-muted text-[12px] tracking-widest uppercase font-semibold">Tribunais TI</div>
      </div>
    </div>
  )
}
