const DEMO_FLAG = 'smart-office-hub-demo-mode'
const DEMO_DATA = 'smart-office-hub-demo-data'

export const DEMO_EMAIL = 'guest@demo.local'
export const DEMO_PASSWORD = 'guest-demo'

export function isDemoMode(): boolean {
  return localStorage.getItem(DEMO_FLAG) === 'true'
}

export function enterDemoMode(): void {
  localStorage.removeItem(DEMO_DATA)
  localStorage.setItem(DEMO_FLAG, 'true')
}

export function exitDemoMode(): void {
  localStorage.removeItem(DEMO_FLAG)
  localStorage.removeItem(DEMO_DATA)
}

export function loadDemoData(): string | null {
  return localStorage.getItem(DEMO_DATA)
}

export function saveDemoData(json: string): void {
  localStorage.setItem(DEMO_DATA, json)
}
