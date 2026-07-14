import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'

type Mode = 'login' | 'register'

function PasswordInput({
                           id,
                           value,
                           onChange,
                           placeholder = '••••••••',
                           autoComplete,
                           className,
                       }: {
    id: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    autoComplete?: string
    className?: string
}) {
    const [show, setShow] = useState(false)
    return (
        <div className="relative">
            <input
                id={id}
                type={show ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className={`w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition ${className ?? ''}`}
            />
            <button
                type="button"
                onClick={() => setShow((s) => !s)}
                tabIndex={-1}
                aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    )
}

function PasswordStrengthBar({ password }: { password: string }) {
    const checks = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    }
    const score = Object.values(checks).filter(Boolean).length

    const label = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'][score]
    const colors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500']

    if (!password) return null

    return (
        <div className="space-y-1.5 mt-1">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= score ? colors[score] : 'bg-muted'
                        }`}
                    />
                ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
                {[
                    { key: 'length', label: '8+ caracteres' },
                    { key: 'upper', label: '1 maiúscula' },
                    { key: 'number', label: '1 número' },
                    { key: 'special', label: '1 especial' },
                ].map(({ key, label }) => (
                    <span
                        key={key}
                        className={`text-xs transition-colors ${
                            checks[key as keyof typeof checks]
                                ? 'text-emerald-500'
                                : 'text-muted-foreground'
                        }`}
                    >
                        {checks[key as keyof typeof checks] ? '✓' : '·'} {label}
                    </span>
                ))}
            </div>
        </div>
    )
}

export default function Login() {
    const { loginWithGoogle, loginWithCredentials, registerWithCredentials } = useAuth()
    const navigate = useNavigate()
    const [mode, setMode] = useState<Mode>('login')
    const [loading, setLoading] = useState(false)

    const [loginForm, setLoginForm] = useState({ username: '', password: '' })
    const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '' })

    // ── Google ──────────────────────────────────────────────────────────────
    async function handleGoogleSuccess(credential: string) {
        setLoading(true)
        try {
            const result = await loginWithGoogle(credential)
            if (result.primeiro_acesso && result.dados) {
                navigate('/primeiro-acesso', { state: result.dados })
            } else {
                navigate('/inicio')
            }
        } catch (err: any) {
            if (err.response?.status === 403) {
                toast.error('Acesso não autorizado. Entre em contato com o administrador.')
            } else {
                toast.error('Erro ao realizar login. Tente novamente.')
            }
        } finally {
            setLoading(false)
        }
    }

    // ── Login com credenciais ────────────────────────────────────────────────
    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        if (!loginForm.username || !loginForm.password) {
            toast.error('Preencha usuário e senha.')
            return
        }
        setLoading(true)
        try {
            const result = await loginWithCredentials(loginForm.username, loginForm.password)
            // Backend retorna primeiro_acesso:true quando PessoaID == 0 (cadastro incompleto)
            if (result.primeiro_acesso && result.dados) {
                navigate('/primeiro-acesso', { state: result.dados })
            } else {
                navigate('/inicio')
            }
        } catch (err: any) {
            if (err.response?.status === 401) {
                toast.error('Usuário ou senha incorretos.')
            } else if (err.response?.status === 403) {
                toast.error('Usuário inativo. Entre em contato com o administrador.')
            } else {
                toast.error('Erro ao realizar login. Tente novamente.')
            }
        } finally {
            setLoading(false)
        }
    }

    // ── Cadastro ─────────────────────────────────────────────────────────────
    const passwordValid =
        registerForm.password.length >= 8 &&
        /[A-Z]/.test(registerForm.password) &&
        /[0-9]/.test(registerForm.password) &&
        /[^A-Za-z0-9]/.test(registerForm.password)

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault()
        if (!registerForm.username || !registerForm.password || !registerForm.confirmPassword) {
            toast.error('Preencha todos os campos.')
            return
        }
        if (!passwordValid) {
            toast.error('A senha não atende aos requisitos mínimos.')
            return
        }
        if (registerForm.password !== registerForm.confirmPassword) {
            toast.error('As senhas não coincidem.')
            return
        }
        setLoading(true)
        try {
            await registerWithCredentials(registerForm.username, registerForm.password)
            toast.success('Cadastro realizado! Faça login para continuar.')
            setMode('login')
            setLoginForm({ username: registerForm.username, password: '' })
            setRegisterForm({ username: '', password: '', confirmPassword: '' })
        } catch (err: any) {
            if (err.response?.status === 409) {
                toast.error('Nome de usuário já está em uso.')
            } else {
                toast.error('Erro ao realizar cadastro. Tente novamente.')
            }
        } finally {
            setLoading(false)
        }
    }

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-8">
                {/* Logo */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
                        <svg className="w-7 h-7 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">PontoCerto</h1>
                    <p className="text-sm text-muted-foreground">Sistema de marcação de ponto</p>
                </div>

                {/* Tabs */}
                <div className="flex rounded-xl border border-border bg-muted/40 p-1 gap-1">
                    <button
                        onClick={() => setMode('login')}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                            mode === 'login'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => setMode('register')}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                            mode === 'register'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Cadastrar
                    </button>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-5">
                    {mode === 'login' ? (
                        <>
                            <div className="space-y-1">
                                <h2 className="text-base font-medium text-foreground">Entrar na sua conta</h2>
                                <p className="text-sm text-muted-foreground">Use suas credenciais ou conta Google</p>
                            </div>

                            {/* Login com usuário/senha */}
                            <form onSubmit={handleLogin} className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground" htmlFor="username">
                                        Usuário
                                    </label>
                                    <input
                                        id="username"
                                        type="text"
                                        value={loginForm.username}
                                        onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                                        placeholder="seu.usuario"
                                        autoComplete="username"
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground" htmlFor="password">
                                        Senha
                                    </label>
                                    <PasswordInput
                                        id="password"
                                        value={loginForm.password}
                                        onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                                        autoComplete="current-password"
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Entrando...' : 'Entrar'}
                                </Button>
                            </form>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
                                </div>
                            </div>

                            {/* Google */}
                            <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
                                <GoogleLogin
                                    onSuccess={(response) => {
                                        if (response.credential) handleGoogleSuccess(response.credential)
                                    }}
                                    onError={() => toast.error('Erro ao conectar com o Google.')}
                                    width="100%"
                                    theme="outline"
                                    shape="rectangular"
                                    text="signin_with"
                                />
                            </div>

                            {loading && (
                                <p className="text-center text-sm text-muted-foreground animate-pulse">
                                    Verificando acesso...
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <h2 className="text-base font-medium text-foreground">Criar conta</h2>
                                <p className="text-sm text-muted-foreground">Você será direcionado para completar seu cadastro após o primeiro login</p>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground" htmlFor="reg-username">
                                        Usuário
                                    </label>
                                    <input
                                        id="reg-username"
                                        type="text"
                                        value={registerForm.username}
                                        onChange={(e) => setRegisterForm((p) => ({ ...p, username: e.target.value }))}
                                        placeholder="seu.usuario"
                                        autoComplete="username"
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground" htmlFor="reg-password">
                                        Senha
                                    </label>
                                    <PasswordInput
                                        id="reg-password"
                                        value={registerForm.password}
                                        onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))}
                                        autoComplete="new-password"
                                    />
                                    <PasswordStrengthBar password={registerForm.password} />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground" htmlFor="reg-confirm">
                                        Confirmar senha
                                    </label>
                                    <PasswordInput
                                        id="reg-confirm"
                                        value={registerForm.confirmPassword}
                                        onChange={(e) => setRegisterForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                                        autoComplete="new-password"
                                        className={
                                            registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword
                                                ? 'border-red-400 focus:ring-red-400'
                                                : ''
                                        }
                                    />
                                    {registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword && (
                                        <p className="text-xs text-red-500">As senhas não coincidem</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full mt-2"
                                    disabled={loading || !passwordValid || registerForm.password !== registerForm.confirmPassword}
                                >
                                    {loading ? 'Cadastrando...' : 'Cadastrar'}
                                </Button>
                            </form>
                        </>
                    )}
                </div>

                <p className="text-center text-xs text-muted-foreground">
                    Problemas para acessar? Fale com o administrador do sistema.
                </p>
            </div>
        </div>
    )
}