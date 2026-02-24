import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { LcarsButton, LcarsInput, LcarsPanel } from '@/components/lcars'
import { api } from '@/lib/api'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setError(null)
    setLoading(true)

    try {
      await api.forgotPassword(data.email)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
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

        <LcarsPanel corner="all" header="Password Recovery" headerColor="orange">
          {success ? (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-lcars-orange tracking-wider mb-2">
                  Check Your Email
                </h1>
                <p className="text-text-muted">Password reset instructions sent</p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-lcars-sage/20 border border-lcars-sage rounded-lg">
                <CheckCircle className="w-5 h-5 text-lcars-sage flex-shrink-0" />
                <p className="text-lcars-sage">
                  If an account with that email exists, you will receive a password reset link.
                </p>
              </div>

              <Link to="/login">
                <LcarsButton className="w-full" size="lg" variant="secondary">
                  <ArrowLeft className="w-5 h-5 mr-2 inline" />
                  Back to Login
                </LcarsButton>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-lcars-orange tracking-wider mb-2">
                  Forgot Password
                </h1>
                <p className="text-text-muted">Enter your email to receive a reset link</p>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-lcars-salmon/20 border border-lcars-salmon rounded-lg">
                  <AlertCircle className="w-5 h-5 text-lcars-salmon flex-shrink-0" />
                  <p className="text-lcars-salmon">{error}</p>
                </div>
              )}

              <LcarsInput
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />

              <LcarsButton
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  'Sending...'
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2 inline" />
                    Send Reset Link
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
