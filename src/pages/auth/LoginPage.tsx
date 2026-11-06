import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Package, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { signIn, isAuthenticated, isLoading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    const { error } = await signIn(data.email, data.password)
    if (error) setError(error)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background auth-gradient-bg px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-8 w-8 text-primary" strokeWidth={2} />
            <span className="text-2xl font-semibold text-text-primary">
              Smart Office Hub
            </span>
          </div>
          <p className="text-sm text-text-secondary">
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border-default bg-surface p-5 sm:p-8">
          {error && (
            <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="h-10 w-full rounded-lg border border-border-default bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-[13px] sm:text-sm font-medium text-text-primary">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:text-primary-hover">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-10 w-full rounded-lg border border-border-default bg-background px-3 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-text-inverse hover:bg-primary-hover disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-medium text-primary hover:text-primary-hover"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
