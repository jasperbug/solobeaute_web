'use client'

import { useState } from 'react'

type CopyButtonProps = {
  value: string
  idleLabel: string
  copiedLabel: string
  className?: string
}

export function CopyButton({ value, idleLabel, copiedLabel, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button className={className} type="button" onClick={onCopy}>
      {copied ? copiedLabel : idleLabel}
    </button>
  )
}
