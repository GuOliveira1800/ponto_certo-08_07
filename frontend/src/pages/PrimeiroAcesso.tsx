import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth, type PrimeiroAcessoData } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

function formatCPF(value: string) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14)
}

export default function PrimeiroAcesso() {
    const location = useLocation()
    const navigate = useNavigate()
    const { completarCadastro } = useAuth()
    const dados = location.state as PrimeiroAcessoData

    const [form, setForm] = useState({
        nome: '',
        sobrenome: '',
        cpf: '',
        dt_nascimento: '',
    })
    const [loading, setLoading] = useState(false)
    console.log('state recebido:', location.state)
    // Se chegou aqui sem os dados do state, redireciona para login
    if (!dados.google_id) {
        navigate('/login')
        return null
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target
        if (name === 'cpf') {
            setForm((prev) => ({ ...prev, cpf: formatCPF(value) }))
        } else {
            setForm((prev) => ({ ...prev, [name]: value }))
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!form.nome || !form.sobrenome || !form.cpf || !form.dt_nascimento) {
            toast.error('Preencha todos os campos.')
            return
        }

        setLoading(true)
        try {
            console.log("Dados: ",dados)
            await completarCadastro({
                email: dados.email,
                google_id: dados.google_id,  // precisa vir no state
                picture: dados.picture,
                nome: form.nome,
                sobrenome: form.sobrenome,
                cpf: form.cpf.replace(/\D/g, ''),
                dt_nascimento: form.dt_nascimento,
            })
            toast.success('Cadastro concluído! Bem-vindo(a)!')
            navigate('/inicio')
        } catch {
            toast.error('Erro ao completar cadastro. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Cabeçalho */}
                <div className="text-center space-y-1">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
                        <svg className="w-7 h-7 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bem-vindo(a)!</h1>
                    <p className="text-sm text-muted-foreground">Complete seu cadastro para continuar</p>
                </div>

                {/* Info do usuário Google */}
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
                    <img src={dados.picture} alt={dados.name} className="w-9 h-9 rounded-full" />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{dados.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{dados.email}</p>
                    </div>
                    <div className="ml-auto text-right shrink-0">
                        <p className="text-xs font-medium text-foreground">{dados.cargo}</p>
                        <p className="text-xs text-muted-foreground">{dados.departamento}</p>
                    </div>
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground" htmlFor="nome">
                                Nome
                            </label>
                            <input
                                id="nome"
                                name="nome"
                                type="text"
                                value={form.nome}
                                onChange={handleChange}
                                placeholder="João"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground" htmlFor="sobrenome">
                                Sobrenome
                            </label>
                            <input
                                id="sobrenome"
                                name="sobrenome"
                                type="text"
                                value={form.sobrenome}
                                onChange={handleChange}
                                placeholder="Silva"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground" htmlFor="cpf">
                            CPF
                        </label>
                        <input
                            id="cpf"
                            name="cpf"
                            type="text"
                            value={form.cpf}
                            onChange={handleChange}
                            placeholder="000.000.000-00"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground" htmlFor="dt_nascimento">
                            Data de nascimento
                        </label>
                        <input
                            id="dt_nascimento"
                            name="dt_nascimento"
                            type="date"
                            value={form.dt_nascimento}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                        />
                    </div>

                    <Button type="submit" className="w-full mt-2" disabled={loading}>
                        {loading ? 'Salvando...' : 'Concluir cadastro'}
                    </Button>
                </form>
            </div>
        </div>
    )
}