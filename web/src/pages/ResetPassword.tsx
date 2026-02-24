import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Key, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { LcarsButton, LcarsInput, LcarsPanel } from '@/components/lcars'
import { api } from '@/lib/api'

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError('Missing reset token')
      return
    }

    setError(null)
    setLoading(true)

    try {
      await api.resetPassword(token, data.password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4">
        <div className="w-full max-w-md">
          <LcarsPanel corner="all" header="Invalid Link" headerColor="salmon">
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-lcars-salmon/20 border border-lcars-salmon rounded-lg">
                <AlertCircle className="w-5 h-5 text-lcars-salmon flex-shrink-0" />
                <p className="text-lcars-salmon">
                  This password reset link is invalid or has expired.
                </p>
              </div>

              <Link to="/forgot-password">
                <LcarsButton className="w-full" size="lg">
                  Request New Link
                </LcarsButton>
              </Link>
            </div>
          </LcarsPanel>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4">
      <div className="w-full max-w-md">
        {/* LCARS decorative header */}
        <div className="flex items-stretch gap-2 mb-4">
          <div className="w-20 h-12 bg-lcars-orange rounded-tl-[2rem] rounded-bl-[2rem]" />
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="h-2 bg-lcars-lavender rounded-r-full" />
            <div className="h-2 bg-lcars-periwinkle rounded-r-full w-3/4" />
          </div>
        </div>

        <LcarsPanel corner="all" header="Reset Password" headerColor="orange">
          {success ? (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-lcars-orange tracking-wider mb-2">
                  Password Reset
                </h1>
                <p className="text-text-muted">Your password has been changed</p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-lcars-sage/20 border border-lcars-sage rounded-lg">
                <CheckCircle className="w-5 h-5 text-lcars-sage flex-shrink-0" />
                <p className="text-lcars-sage">
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
              </div>

              <LcarsButton
                className="w-full"
                size="lg"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft className="w-5 h-5 mr-2 inline" />
                Go to Login
              </LcarsButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-lcars-orange tracking-wider mb-2">
                  New Password
                </h1>
                <p className="text-text-muted">Enter your new password</p>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-lcars-salmon/20 border border-lcars-salmon rounded-lg">
                  <AlertCircle className="w-5 h-5 text-lcars-salmon flex-shrink-0" />
                  <p className="text-lcars-salmon">{error}</p>
                </div>
              )}

              <LcarsInput
                label="New Password"
                type="password"
                placeholder="Enter new password"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password')}
              />

              <LcarsInput
                label="Confirm Password"
                type="password"
                placeholder="Confirm new password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <LcarsButton
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  'Resetting...'
                ) : (
                  <>
                    <Key className="w-5 h-5 mr-2 inline" />
                    Reset Password
                  </>
                )}
              </LcarsButton>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-lcars-periwinkle hover:text-lcars-lavender transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </LcarsPanel>

        {/* LCARS decorative footer */}
        <div className="flex items-stretch gap-2 mt-4">
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="h-2 bg-lcars-sky rounded-l-full" />
            <div className="h-2 bg-lcars-sage rounded-l-full w-2/3 ml-auto" />
          </div>
          <div className="w-20 h-12 bg-lcars-periwinkle rounded-tr-[2rem] rounded-br-[2rem]" />
        </div>
      </div>
    </div>
  )
}
