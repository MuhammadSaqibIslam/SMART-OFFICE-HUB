import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Loader2, MailCheck, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

const schema = z.object({
  email: z.string().email('Valid email is required'),
})
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [sent, setSent] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const { error } = await resetPassword(data.email)
    if (error) { setError(error); return }
    setSentTo(data.email)
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-2 flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" strokeWidth={2} />
            <span className="text-2xl font-semibold text-text-primary">Smart Office Hub</span>
          </div>
          <p className="text-sm text-text-secondary">Reset your password</p>
        </div>

        <div className="rounded-2xl border border-border-default bg-surface p-8">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                <MailCheck className="h-7 w-7 text-success" />
              </div>
              <h2 className="text-base font-semibold text-text-primary">Check your email</h2>
              <p className="mt-1 text-sm text-text-secondary">
                We sent a password reset link to <strong>{sentTo}</strong>. Open it to set a new password.
              </p>
              <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover">
                <ArrowLeft className="h-4 w-4" /> Back to login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
              )}
              <p className="mb-4 text-sm text-text-secondary">
                Enter your account email and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-text-primary">Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="h-10 w-full rounded-lg border border-border-default bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
                    {...register('email')}
                  />
                  {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-text-inverse hover:bg-primary-hover disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-text-secondary">
                <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary-hover">
                  <ArrowLeft className="h-4 w-4" /> Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
