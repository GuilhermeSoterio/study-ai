import newImg from '@/assets/new.png'

// ── Helpers ───────────────────────────────────────────────────────────────────

function G({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      background: 'linear-gradient(135deg, #d4a017, #f5d06b, #d4a017)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontWeight: 900,
    }}>
      {children}
    </span>
  )
}

function GoldLine() {
  return (
    <div style={{
      height: 1,
      background: 'linear-gradient(90deg, transparent, rgba(212,160,23,0.6), rgba(245,208,107,0.9), rgba(212,160,23,0.6), transparent)',
      margin: '0 auto',
      width: '100%',
    }} />
  )
}

function Section({
  index, title, delay, children,
}: {
  index: string; title: string; delay: number; children: React.ReactNode
}) {
  return (
    <div style={{ animation: `manifesto-in 0.9s ${delay}s cubic-bezier(0.22,1,0.36,1) both` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <span style={{
          fontSize: 10, fontWeight: 900, letterSpacing: '0.35em',
          color: 'rgba(212,160,23,0.55)', fontFamily: 'serif',
        }}>
          {index}
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(212,160,23,0.20)' }} />
        <span style={{
          fontSize: 9, fontWeight: 900, letterSpacing: '0.45em',
          color: 'rgba(212,160,23,0.45)', textTransform: 'uppercase',
        }}>
          {title}
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(212,160,23,0.20)' }} />
      </div>
      <p style={{
        fontSize: 17,
        lineHeight: 2,
        color: 'rgba(230,220,200,0.85)',
        fontWeight: 400,
        letterSpacing: '0.01em',
        maxWidth: 720,
        margin: '0 auto',
        textAlign: 'center',
      }}>
        {children}
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function NewAge() {
  return (
    <div style={{
      background: '#000000',
      minHeight: '100vh',
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
      overflowX: 'hidden',
      paddingBottom: 120,
    }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingBottom: 64,
        position: 'relative',
        animation: 'splash-in 0.8s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        {/* Radial glow backdrop */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(212,160,23,0.10) 0%, rgba(212,160,23,0.03) 45%, transparent 70%)',
          pointerEvents: 'none',
          borderRadius: '50%',
        }} />

        {/* Logo */}
        <img
          src={newImg}
          alt="New Age"
          style={{
            width: 200,
            height: 'auto',
            position: 'relative',
            animation: 'logo-float 3.5s ease-in-out infinite, logo-glow 3.5s ease-in-out infinite',
          }}
        />

        {/* Eyebrow */}
        <div style={{
          marginTop: 36,
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '0.5em',
          color: 'rgba(212,160,23,0.60)',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}>
          NEW AGE · UNIDADE DE RESILIÊNCIA
        </div>

        {/* Title */}
        <div style={{
          marginTop: 16,
          fontSize: 42,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          textAlign: 'center',
          lineHeight: 1.1,
          background: 'linear-gradient(180deg, #ffffff 0%, rgba(230,220,200,0.7) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          O MANIFESTO
        </div>

        <div style={{ marginTop: 40, width: '100%', maxWidth: 600, padding: '0 32px' }}>
          <GoldLine />
        </div>
      </div>

      {/* ── MANIFESTO ────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: '0 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 72,
      }}>

        {/* I */}
        <Section index="I" title="Frequência do Objetivo" delay={0.3}>
          O mundo ao redor é um <G>ruído estatístico</G>. Distrações, prazeres imediatos e
          opiniões alheias são <G>frequências parasitas</G> que tentam desestabilizar a
          frequência do objetivo maior. A realidade imediata é uma ficção.{' '}
          A única verdade absoluta reside no <G>Estado de Aprovação</G> — um futuro que já
          foi decidido no presente através da <G>disciplina</G>.
        </Section>

        <GoldLine />

        {/* II */}
        <Section index="II" title="Kintsugi" delay={0.5}>
          Nós rejeitamos a perfeição estéril. A aprovação não é o prêmio de quem nunca
          errou, mas a <G>coroa de quem foi quebrado e reconstruído em ouro</G>.
        </Section>

        <GoldLine />

        {/* III */}
        <Section index="III" title="Potência Deliberada" delay={0.7}>
          A potência humana não reside no talento nato, mas na capacidade deliberada de{' '}
          <G>suportar o tédio, a repetição e a solidão</G>.
        </Section>

        <GoldLine />

        {/* IV */}
        <Section index="IV" title="Disciplina como Poder" delay={0.9}>
          Dizer "sim" ao objetivo exige dizer "não" a mil prazeres. A abstenção de
          distrações não é um sacrifício — é um <G>investimento em poder</G>.{' '}
          É isso que <G>nos separa dos medíocres</G>.
        </Section>

        {/* ── CLOSING ──────────────────────────────────────────────── */}
        <div style={{
          animation: 'manifesto-in 1s 1.1s cubic-bezier(0.22,1,0.36,1) both',
          textAlign: 'center',
          paddingTop: 24,
        }}>
          {/* Double gold rule */}
          <div style={{ marginBottom: 48 }}>
            <div style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(212,160,23,0.8), transparent)',
              marginBottom: 4,
            }} />
            <div style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(245,208,107,0.4), transparent)',
            }} />
          </div>

          <div style={{
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: '0.04em',
            lineHeight: 1.5,
            background: 'linear-gradient(135deg, #d4a017, #f5d06b, #e8b84b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 24,
          }}>
            "O VALOR NÃO ESTÁ NA PERFEIÇÃO,<br />MAS NA RESISTÊNCIA APÓS A QUEDA."
          </div>

          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.4em',
            color: 'rgba(212,160,23,0.50)',
            textTransform: 'uppercase',
          }}>
            New Age — Unidade de Resiliência
          </div>
        </div>

      </div>
    </div>
  )
}
