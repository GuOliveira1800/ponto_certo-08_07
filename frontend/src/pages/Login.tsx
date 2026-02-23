import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export default function Login() {
    const { loginWithGoogle } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

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

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-8">
                {/* Logo / Título */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
                        <svg className="w-7 h-7 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">PontoCerto</h1>
                    <p className="text-sm text-muted-foreground">Sistema de marcação de ponto</p>
                </div>

                {/* Card de login */}
                <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-base font-medium text-foreground">Entrar na sua conta</h2>
                        <p className="text-sm text-muted-foreground">Use sua conta Google corporativa</p>
                    </div>

                    <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
                        <GoogleLogin
                            onSuccess={(response) => {
                                if (response.credential) {
                                    handleGoogleSuccess(response.credential)
                                }
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
                </div>

                <p className="text-center text-xs text-muted-foreground">
                    Problemas para acessar? Fale com o administrador do sistema.
                </p>
            </div>
        </div>
    )
}