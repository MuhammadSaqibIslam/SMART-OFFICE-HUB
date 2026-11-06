import {
  Sparkles,
  Package,
  Monitor,
  Users,
  AlertTriangle,
  ShoppingCart,
  Search,
} from 'lucide-react'

const suggestions = [
  { text: 'Who has which laptop?', icon: Monitor },
  { text: 'How many monitors are available?', icon: Search },
  { text: 'Which items are running low?', icon: AlertTriangle },
  { text: 'Show assets assigned to employees', icon: Users },
  { text: 'Which office supplies are in stock?', icon: Package },
  { text: 'Are there any unassigned laptops?', icon: ShoppingCart },
]

interface WelcomeScreenProps {
  onSuggestionClick: (question: string) => void
}

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 animate-fade-in">
      {/* Logo */}
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
        <Sparkles className="h-6 w-6 text-primary" strokeWidth={1.5} />
      </div>

      <h2 className="text-xl font-semibold text-text-primary text-center">
        Ask AI
      </h2>
      <p className="mt-1 text-[13px] text-text-muted text-center max-w-xs">
        Ask questions about your inventory, employees, and assets.
      </p>

      {/* Suggestions */}
      <div className="mt-8 w-full max-w-xl">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3 text-center">
          Try asking
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {suggestions.map(({ text, icon: Icon }) => (
            <button
              key={text}
              onClick={() => onSuggestionClick(text)}
              className="group flex items-center gap-3 rounded-xl border border-border-default bg-surface px-4 py-3.5 text-left text-sm text-text-secondary transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-text-primary hover:shadow-sm"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-text-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <span>{text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
