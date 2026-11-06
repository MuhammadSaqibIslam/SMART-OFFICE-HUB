/**
 * Minimal, geometric SVG illustrations for empty states.
 * Uses CSS custom properties for theme compatibility (light + dark).
 * All illustrations are decorative (aria-hidden).
 */

interface IllustrationProps {
  className?: string
}

export function EmptyInventoryIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} aria-hidden="true">
      {/* Background shape */}
      <ellipse cx="100" cy="140" rx="70" ry="8" fill="var(--color-primary)" opacity="0.06" />
      {/* Box body */}
      <rect x="50" y="45" width="100" height="75" rx="8" fill="var(--color-surface-secondary)" stroke="var(--color-border-default)" strokeWidth="1.5" />
      {/* Box flaps */}
      <path d="M50 55L70 35H130L150 55" fill="var(--color-surface)" stroke="var(--color-border-default)" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Opening line */}
      <line x1="100" y1="35" x2="100" y2="55" stroke="var(--color-border-default)" strokeWidth="1.5" />
      {/* Items inside - circles */}
      <circle cx="78" cy="85" r="10" fill="var(--color-primary)" opacity="0.15" />
      <circle cx="100" cy="90" r="8" fill="var(--color-primary)" opacity="0.1" />
      <circle cx="122" cy="85" r="10" fill="var(--color-primary)" opacity="0.15" />
      {/* Sparkle */}
      <circle cx="145" cy="40" r="3" fill="var(--color-primary)" opacity="0.3" />
      <circle cx="55" cy="38" r="2" fill="var(--color-primary)" opacity="0.2" />
    </svg>
  )
}

export function EmptyEmployeesIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} aria-hidden="true">
      <ellipse cx="100" cy="140" rx="70" ry="8" fill="var(--color-primary)" opacity="0.06" />
      {/* Person 1 - center */}
      <circle cx="100" cy="55" r="18" fill="var(--color-surface-secondary)" stroke="var(--color-border-default)" strokeWidth="1.5" />
      <circle cx="100" cy="50" r="8" fill="var(--color-primary)" opacity="0.2" />
      <path d="M82 80C82 70 90 62 100 62C110 62 118 70 118 80" fill="var(--color-primary)" opacity="0.12" />
      {/* Person 2 - left */}
      <circle cx="58" cy="72" r="14" fill="var(--color-surface-secondary)" stroke="var(--color-border-default)" strokeWidth="1.5" />
      <circle cx="58" cy="68" r="6" fill="var(--color-primary)" opacity="0.15" />
      <path d="M44 92C44 84 50 78 58 78C66 78 72 84 72 92" fill="var(--color-primary)" opacity="0.08" />
      {/* Person 3 - right */}
      <circle cx="142" cy="72" r="14" fill="var(--color-surface-secondary)" stroke="var(--color-border-default)" strokeWidth="1.5" />
      <circle cx="142" cy="68" r="6" fill="var(--color-primary)" opacity="0.15" />
      <path d="M128 92C128 84 134 78 142 78C150 78 156 84 156 92" fill="var(--color-primary)" opacity="0.08" />
      {/* Connecting lines */}
      <line x1="78" y1="65" x2="72" y2="68" stroke="var(--color-border-default)" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="122" y1="65" x2="128" y2="68" stroke="var(--color-border-default)" strokeWidth="1" strokeDasharray="3 3" />
      {/* Badge card */}
      <rect x="82" y="100" width="36" height="24" rx="4" fill="var(--color-surface)" stroke="var(--color-border-default)" strokeWidth="1.5" />
      <rect x="88" y="106" width="24" height="3" rx="1.5" fill="var(--color-primary)" opacity="0.2" />
      <rect x="88" y="113" width="16" height="3" rx="1.5" fill="var(--color-border-default)" />
    </svg>
  )
}

export function EmptyAssetsIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} aria-hidden="true">
      <ellipse cx="100" cy="140" rx="70" ry="8" fill="var(--color-primary)" opacity="0.06" />
      {/* Monitor */}
      <rect x="45" y="35" width="110" height="70" rx="8" fill="var(--color-surface-secondary)" stroke="var(--color-border-default)" strokeWidth="1.5" />
      {/* Screen */}
      <rect x="52" y="42" width="96" height="50" rx="4" fill="var(--color-surface)" stroke="var(--color-border-default)" strokeWidth="1" />
      {/* Screen content lines */}
      <rect x="62" y="52" width="40" height="3" rx="1.5" fill="var(--color-primary)" opacity="0.2" />
      <rect x="62" y="60" width="60" height="2" rx="1" fill="var(--color-border-default)" />
      <rect x="62" y="66" width="50" height="2" rx="1" fill="var(--color-border-default)" />
      <rect x="62" y="72" width="55" height="2" rx="1" fill="var(--color-border-default)" />
      {/* Checkmark on screen */}
      <circle cx="130" cy="62" r="10" fill="var(--color-primary)" opacity="0.1" />
      <path d="M125 62L128 65L135 58" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      {/* Stand */}
      <rect x="90" y="105" width="20" height="6" rx="2" fill="var(--color-surface-secondary)" stroke="var(--color-border-default)" strokeWidth="1.5" />
      <rect x="82" y="111" width="36" height="5" rx="2.5" fill="var(--color-surface-secondary)" stroke="var(--color-border-default)" strokeWidth="1.5" />
      {/* Keyboard */}
      <rect x="55" y="120" width="90" height="10" rx="4" fill="var(--color-surface-secondary)" stroke="var(--color-border-default)" strokeWidth="1" />
      <rect x="62" y="123" width="4" height="4" rx="1" fill="var(--color-border-default)" />
      <rect x="70" y="123" width="4" height="4" rx="1" fill="var(--color-border-default)" />
      <rect x="78" y="123" width="4" height="4" rx="1" fill="var(--color-border-default)" />
      <rect x="86" y="123" width="28" height="4" rx="1" fill="var(--color-border-default)" />
      <rect x="118" y="123" width="4" height="4" rx="1" fill="var(--color-border-default)" />
      <rect x="126" y="123" width="4" height="4" rx="1" fill="var(--color-border-default)" />
      <rect x="134" y="123" width="4" height="4" rx="1" fill="var(--color-border-default)" />
    </svg>
  )
}

export function EmptyPurchaseIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} aria-hidden="true">
      <ellipse cx="100" cy="140" rx="70" ry="8" fill="var(--color-primary)" opacity="0.06" />
      {/* Clipboard */}
      <rect x="55" y="25" width="90" height="110" rx="8" fill="var(--color-surface-secondary)" stroke="var(--color-border-default)" strokeWidth="1.5" />
      {/* Clip */}
      <rect x="80" y="18" width="40" height="16" rx="4" fill="var(--color-surface)" stroke="var(--color-border-default)" strokeWidth="1.5" />
      <circle cx="100" cy="26" r="3" fill="var(--color-border-default)" />
      {/* Lines */}
      <rect x="70" y="48" width="60" height="3" rx="1.5" fill="var(--color-primary)" opacity="0.2" />
      <rect x="70" y="60" width="50" height="2" rx="1" fill="var(--color-border-default)" />
      <rect x="70" y="70" width="55" height="2" rx="1" fill="var(--color-border-default)" />
      <rect x="70" y="80" width="45" height="2" rx="1" fill="var(--color-border-default)" />
      {/* Checkboxes */}
      <rect x="70" y="95" width="10" height="10" rx="2" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" opacity="0.3" />
      <rect x="70" y="111" width="10" height="10" rx="2" stroke="var(--color-primary)" strokeWidth="1.5" fill="none" opacity="0.3" />
      <rect x="85" y="98" width="40" height="2" rx="1" fill="var(--color-border-default)" />
      <rect x="85" y="114" width="35" height="2" rx="1" fill="var(--color-border-default)" />
      {/* Decorative */}
      <circle cx="152" cy="35" r="3" fill="var(--color-primary)" opacity="0.2" />
      <circle cx="48" cy="70" r="2" fill="var(--color-primary)" opacity="0.15" />
    </svg>
  )
}

export function EmptyActivityIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} aria-hidden="true">
      <ellipse cx="100" cy="140" rx="70" ry="8" fill="var(--color-primary)" opacity="0.06" />
      {/* Timeline line */}
      <line x1="100" y1="25" x2="100" y2="130" stroke="var(--color-border-default)" strokeWidth="2" strokeDasharray="4 4" />
      {/* Nodes */}
      <circle cx="100" cy="40" r="8" fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth="2" opacity="0.3" />
      <circle cx="100" cy="40" r="3" fill="var(--color-primary)" opacity="0.3" />
      <circle cx="100" cy="75" r="8" fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth="2" opacity="0.2" />
      <circle cx="100" cy="75" r="3" fill="var(--color-primary)" opacity="0.2" />
      <circle cx="100" cy="110" r="8" fill="var(--color-surface)" stroke="var(--color-border-default)" strokeWidth="2" />
      {/* Cards */}
      <rect x="118" y="30" width="55" height="20" rx="4" fill="var(--color-surface)" stroke="var(--color-border-default)" strokeWidth="1" />
      <rect x="124" y="36" width="30" height="2" rx="1" fill="var(--color-primary)" opacity="0.2" />
      <rect x="124" y="42" width="40" height="2" rx="1" fill="var(--color-border-default)" />
      <rect x="27" y="65" width="55" height="20" rx="4" fill="var(--color-surface)" stroke="var(--color-border-default)" strokeWidth="1" />
      <rect x="33" y="71" width="30" height="2" rx="1" fill="var(--color-primary)" opacity="0.2" />
      <rect x="33" y="77" width="40" height="2" rx="1" fill="var(--color-border-default)" />
      <rect x="118" y="100" width="55" height="20" rx="4" fill="var(--color-surface)" stroke="var(--color-border-default)" strokeWidth="1" />
      <rect x="124" y="106" width="30" height="2" rx="1" fill="var(--color-border-default)" />
      <rect x="124" y="112" width="40" height="2" rx="1" fill="var(--color-border-default)" />
    </svg>
  )
}

export function EmptyNotificationsIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 160 120" fill="none" className={className} aria-hidden="true">
      {/* Bell outline */}
      <path d="M80 20C80 20 60 20 55 45C50 70 45 75 45 80H115C115 75 110 70 105 45C100 20 80 20 80 20Z"
        fill="var(--color-surface-secondary)" stroke="var(--color-border-default)" strokeWidth="1.5" />
      {/* Clapper */}
      <circle cx="80" cy="88" r="6" fill="var(--color-surface-secondary)" stroke="var(--color-border-default)" strokeWidth="1.5" />
      {/* Top */}
      <circle cx="80" cy="20" r="3" fill="var(--color-primary)" opacity="0.3" />
      {/* Check circle */}
      <circle cx="105" cy="35" r="14" fill="var(--color-success)" opacity="0.12" />
      <path d="M99 35L103 39L111 31" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      {/* Sparkles */}
      <circle cx="42" cy="35" r="2" fill="var(--color-primary)" opacity="0.2" />
      <circle cx="120" cy="55" r="2.5" fill="var(--color-primary)" opacity="0.15" />
      <circle cx="55" cy="60" r="1.5" fill="var(--color-primary)" opacity="0.1" />
    </svg>
  )
}

export function NoSearchResultsIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} aria-hidden="true">
      <ellipse cx="100" cy="140" rx="70" ry="8" fill="var(--color-primary)" opacity="0.06" />
      {/* Magnifying glass */}
      <circle cx="88" cy="65" r="30" fill="var(--color-surface-secondary)" stroke="var(--color-border-default)" strokeWidth="2" />
      <circle cx="88" cy="65" r="20" fill="var(--color-surface)" stroke="var(--color-border-default)" strokeWidth="1.5" />
      {/* Handle */}
      <line x1="110" y1="87" x2="135" y2="112" stroke="var(--color-border-default)" strokeWidth="6" strokeLinecap="round" />
      <line x1="110" y1="87" x2="135" y2="112" stroke="var(--color-surface-secondary)" strokeWidth="3" strokeLinecap="round" />
      {/* X inside glass */}
      <line x1="80" y1="57" x2="96" y2="73" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="96" y1="57" x2="80" y2="73" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      {/* Dots */}
      <circle cx="155" cy="45" r="3" fill="var(--color-primary)" opacity="0.15" />
      <circle cx="50" cy="100" r="2" fill="var(--color-primary)" opacity="0.1" />
    </svg>
  )
}
