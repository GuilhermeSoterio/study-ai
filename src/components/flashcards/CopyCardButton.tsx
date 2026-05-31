import { useState } from 'react'
import { copyToClipboard, flashcardToText } from '@/lib/utils'
import type { Flashcard } from '@/types'

interface Props {
  card: Flashcard
  /** 'icon' = botão compacto (ex: canto do card) · 'button' = botão com rótulo (ex: barra de ações) */
  variant?: 'icon' | 'button'
  className?: string
}

export function CopyCardButton({ card, variant = 'button', className = '' }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    const ok = await copyToClipboard(flashcardToText(card))
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleCopy}
        title="Copiar pergunta e resposta (para colar numa IA)"
        className={`w-7 h-7 flex items-center justify-center rounded text-[12px] transition-all ${
          copied ? 'text-success opacity-100' : 'text-muted opacity-40 hover:opacity-100 hover:bg-surface3'
        } ${className}`}
      >
        {copied ? '✓' : '⧉'}
      </button>
    )
  }

  return (
    <button
      onClick={handleCopy}
      className={`text-[12px] px-3 py-1.5 rounded-sm border transition-all ${
        copied
          ? 'text-success border-success/30 bg-success/10'
          : 'text-accent border-accent/30 hover:bg-accent/10'
      } ${className}`}
    >
      {copied ? '✓ Copiado!' : '⧉ Copiar'}
    </button>
  )
}
