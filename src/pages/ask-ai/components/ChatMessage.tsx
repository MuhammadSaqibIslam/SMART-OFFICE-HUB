import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sparkles, User } from 'lucide-react'
import type { AIMessage } from '@/types/database'

const MARKDOWN_COMPONENTS: Components = {
  strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
  h1: ({ children }) => <p className="font-semibold text-text-primary">{children}</p>,
  h2: ({ children }) => <p className="font-semibold text-text-primary">{children}</p>,
  h3: ({ children }) => <p className="font-semibold text-text-primary">{children}</p>,
  code: ({ children }) => <code className="rounded bg-surface-secondary px-1 py-0.5 text-[13px]">{children}</code>,
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-lg border border-border-default">
      <table className="w-full border-collapse text-left text-[13px] [overflow-wrap:normal]">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="whitespace-nowrap border-b border-border-default bg-surface-secondary px-3 py-2 font-semibold text-text-primary">{children}</th>,
  td: ({ children }) => <td className="border-b border-border-default px-3 py-2 align-top">{children}</td>,
}

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
          {isUser ? (
            <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
              {message.content}
            </div>
          ) : (
            <div className="space-y-2 text-sm text-text-secondary leading-relaxed [overflow-wrap:anywhere]">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
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
