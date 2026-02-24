import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { LcarsButton, LcarsInput, LcarsPanel } from '@/components/lcars'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    setLoading(true)

    try {
      await login(data.username, data.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
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

        <LcarsPanel corner="all" header="System Access" headerColor="orange">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-lcars-orange tracking-wider mb-2">
                SUMI2 RBAC
              </h1>
              <p className="text-text-muted">Role-Based Access Control System</p>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-lcars-salmon/20 border border-lcars-salmon rounded-lg">
                <AlertCircle className="w-5 h-5 text-lcars-salmon flex-shrink-0" />
                <p className="text-lcars-salmon">{error}</p>
              </div>
            )}

            <LcarsInput
              label="Username"
              placeholder="Enter your username"
              autoComplete="username"
              error={errors.username?.message}
              {...register('username')}
            />

            <LcarsInput
              label="Password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            <LcarsButton
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                'Authenticating...'
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2 inline" />
                  Access System
                </>
              )}
            </LcarsButton>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-lcars-periwinkle hover:text-lcars-lavender transition-colors text-sm"
              >
                Forgot password?
              </Link>
            </div>
          </form>
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
