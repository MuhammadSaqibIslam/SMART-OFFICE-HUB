import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false) // has a recovery session
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // The reset email link establishes a session; confirm one exists.
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const onSubmit = async () => {
    setError(null)
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      await supabase.auth.signOut()
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background auth-gradient-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-2 flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" strokeWidth={2} />
            <span className="text-2xl font-semibold text-text-primary">Smart Office Hub</span>
          </div>
          <p className="text-sm text-text-secondary">Set a new password</p>
        </div>

        <div className="rounded-2xl border border-border-default bg-surface p-8">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <h2 className="text-base font-semibold text-text-primary">Password updated</h2>
              <p className="mt-1 text-sm text-text-secondary">Redirecting you to login…</p>
            </div>
          ) : !ready ? (
            <div className="text-center text-sm text-text-secondary">
              <p>This page opens from the password reset link in your email.</p>
              <p className="mt-2">If you got here by mistake, <Link to="/forgot-password" className="font-medium text-primary hover:text-primary-hover">request a reset link</Link>.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">New Password</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      placeholder="Enter new password"
                      className="h-10 w-full rounded-lg border border-border-default bg-background px-3 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Confirm Password</label>
                  <input
                    type={show ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    className="h-10 w-full rounded-lg border border-border-default bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                <Button
                  onClick={onSubmit}
                  disabled={submitting}
                  className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-text-inverse hover:bg-primary-hover disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
