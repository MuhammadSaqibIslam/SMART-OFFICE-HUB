import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-5xl font-semibold text-primary">404</p>
      <h1 className="mt-3 text-lg font-semibold text-text-primary">Page not found</h1>
      <p className="mt-1 text-sm text-text-muted">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-text-inverse hover:bg-primary-hover"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
