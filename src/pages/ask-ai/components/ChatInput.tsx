import { useState, useRef } from 'react'
import { ArrowUp, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  sending?: boolean
}

export function ChatInput({ onSend, disabled, sending }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled || sending) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const hasValue = value.trim().length > 0

  return (
    <div className="border-t border-border-default bg-surface px-3 sm:px-4 py-3">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-border-default bg-background px-4 py-2 shadow-sm focus-within:border-primary/50 focus-within:shadow-md focus-within:shadow-primary/5 transition-all">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask about inventory, employees, or assets..."
            disabled={disabled || sending}
            rows={1}
            className="flex-1 resize-none bg-transparent py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!hasValue || disabled || sending}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
              hasValue && !sending
                ? 'bg-primary text-white shadow-sm hover:bg-primary-hover'
                : 'bg-surface-secondary text-text-disabled cursor-not-allowed'
            }`}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-text-muted">
          Powered by real company data. Always verify important information.
        </p>
      </div>
    </div>
  )
}
