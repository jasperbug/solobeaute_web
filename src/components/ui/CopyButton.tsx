'use client'

import { useEffect, useRef, useState } from 'react'

type CopyButtonProps = {
  value: string
  idleLabel: string
  copiedLabel: string
  className?: string
}

export function CopyButton({ value, idleLabel, copiedLabel, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 1800)
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
