import { Sparkles, User } from 'lucide-react'
import type { AIMessage } from '@/types/database'

interface ChatMessageProps {
  message: AIMessage
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`px-4 sm:px-6 py-5 ${isUser ? '' : 'bg-surface-secondary/30'}`}>
      <div className="mx-auto max-w-3xl flex gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm ${
          isUser
            ? 'bg-primary text-white'
            : 'bg-surface border border-border-default text-primary'
        }`}>
          {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-xs font-semibold text-text-primary mb-1.5">
            {isUser ? 'You' : 'Ask AI'}
          </p>
          <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ThinkingIndicator() {
  return (
    <div className="px-4 sm:px-6 py-5 bg-surface-secondary/30">
      <div className="mx-auto max-w-3xl flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface border border-border-default text-primary shadow-sm">
          <Sparkles className="h-4 w-4 animate-pulse" />
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-xs font-semibold text-text-primary mb-1.5">Ask AI</p>
          <div className="flex items-center gap-1 pt-0.5">
            <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="ml-2 text-xs text-text-muted">Thinking...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
