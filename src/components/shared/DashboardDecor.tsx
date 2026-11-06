/**
 * Decorative background elements for the Dashboard.
 * Purely visual — no interactivity, hidden from assistive tech.
 */

export function DashboardDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Large blurred blob — top right */}
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/[0.04] blur-3xl" />

      {/* Medium blob — bottom left */}
      <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-info/[0.04] blur-3xl" />

      {/* Floating geometric shapes */}
      <svg className="absolute right-[8%] top-[12%] h-16 w-16 text-primary/[0.07] animate-float" viewBox="0 0 64 64" fill="currentColor">
        <rect x="8" y="8" width="48" height="48" rx="12" />
      </svg>

      <svg className="absolute left-[5%] top-[55%] h-10 w-10 text-info/[0.06] animate-float delay-200" style={{ animationDuration: '5s' }} viewBox="0 0 40 40" fill="currentColor">
        <circle cx="20" cy="20" r="20" />
      </svg>

      <svg className="absolute right-[15%] bottom-[18%] h-8 w-8 text-primary/[0.05] animate-float delay-300" style={{ animationDuration: '6s' }} viewBox="0 0 32 32" fill="currentColor">
        <polygon points="16,0 32,28 0,28" />
      </svg>

      <svg className="absolute left-[35%] top-[8%] h-6 w-6 text-warning/[0.06] animate-float delay-75" style={{ animationDuration: '4.5s' }} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="12" />
      </svg>

      <svg className="absolute right-[40%] bottom-[10%] h-12 w-12 text-success/[0.05] animate-float delay-150" style={{ animationDuration: '5.5s' }} viewBox="0 0 48 48" fill="currentColor">
        <rect x="4" y="4" width="40" height="40" rx="8" transform="rotate(15 24 24)" />
      </svg>

      {/* Dot grid pattern — subtle */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(var(--color-text-primary) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Decorative rings */}
      <svg className="absolute left-[12%] top-[25%] h-20 w-20 text-primary/[0.04]" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="40" cy="40" r="30" />
        <circle cx="40" cy="40" r="18" />
      </svg>

      <svg className="absolute right-[6%] bottom-[35%] h-14 w-14 text-info/[0.04]" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="28" cy="28" r="22" />
        <circle cx="28" cy="28" r="12" />
      </svg>
    </div>
  )
}
