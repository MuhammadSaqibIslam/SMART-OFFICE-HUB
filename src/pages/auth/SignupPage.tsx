import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Package, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupForm = z.infer<typeof signupSchema>

export function SignupPage() {
  const { signUp, isAuthenticated, isLoading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
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

  const onSubmit = async (data: SignupForm) => {
    setError(null)
    const { error } = await signUp(data.email, data.password, data.fullName)
    if (error) {
      setError(error)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border-default bg-surface p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Check your email</h2>
            <p className="mt-2 text-sm text-text-secondary">
              We've sent a confirmation link to your email address. Please verify your account to continue.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block text-sm font-medium text-primary hover:text-primary-hover"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
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
            Create your account
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
            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">
                Full Name
              </label>
              <input
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                className="h-10 w-full rounded-lg border border-border-default bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-danger">{errors.fullName.message}</p>
              )}
            </div>

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
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min 6 characters"
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

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">
                Confirm Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className="h-10 w-full rounded-lg border border-border-default bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>
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
                'Create Account'
              )}
            </Button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary-hover"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
