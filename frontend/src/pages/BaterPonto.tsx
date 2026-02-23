import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useClock } from '@/hooks/useClock'
import { pontoService } from '@/services/pontoService'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner' // ← troca aqui

export default function BaterPonto() {
    const { hours, date } = useClock()
    const [loading, setLoading] = useState(false)
    const [bloqueadoAte, setBloqueadoAte] = useState<Date | null>(null)
    const [ultimoPonto, setUltimoPonto] = useState<string | null>(null)
    const [segundosRestantes, setSegundosRestantes] = useState(0)

    // Countdown do bloqueio
    useEffect(() => {
        if (!bloqueadoAte) return

        const interval = setInterval(() => {
            const restante = Math.ceil((bloqueadoAte.getTime() - Date.now()) / 1000)
            if (restante <= 0) {
                setBloqueadoAte(null)
                setSegundosRestantes(0)
                clearInterval(interval)
            } else {
                setSegundosRestantes(restante)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [bloqueadoAte])

    async function handleBaterPonto() {
        setLoading(true)
        try {
            const ponto = await pontoService.registrar()
            const horaBatida = new Date(ponto.data_ponto).toLocaleTimeString('pt-BR')
            setUltimoPonto(horaBatida)

            // Bloqueia até o fim do minuto atual
            const agora = new Date()
            const fimDoMinuto = new Date(
                agora.getFullYear(),
                agora.getMonth(),
                agora.getDate(),
                agora.getHours(),
                agora.getMinutes() + 1,
                0,
                0
            )
            setBloqueadoAte(fimDoMinuto)

            toast.success('Ponto registrado!', {
                description: `Registrado às ${horaBatida}`,
            })
        } catch (error: any) {
            const msg = error.response?.status === 409
                ? 'Já existe um ponto registrado neste minuto'
                : 'Erro ao registrar ponto. Tente novamente.'


            toast.error('Erro', {
                description: msg,
            })
        } finally {
            setLoading(false)
        }
    }

    const bloqueado = bloqueadoAte !== null

    return (
        <div className="p-6 max-w-md">
            <h2 className="text-2xl font-bold mb-6">Bater Ponto</h2>

            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-8 text-center">
                {/* Relógio */}
                <div>
                    <p className="text-6xl font-mono font-bold tracking-tight">{hours}</p>
                    <p className="text-sm text-muted-foreground mt-2 capitalize">{date}</p>
                </div>

                {/* Botão */}
                <Button
                    size="lg"
                    className="w-48 h-48 rounded-full text-lg font-semibold shadow-lg transition-all"
                    onClick={handleBaterPonto}
                    disabled={bloqueado || loading}
                    variant={bloqueado ? 'secondary' : 'default'}
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={32} />
                    ) : bloqueado ? (
                        <div className="flex flex-col items-center gap-1">
                            <CheckCircle2 size={36} />
                            <span className="text-sm">{segundosRestantes}s</span>
                        </div>
                    ) : (
                        'Bater Ponto'
                    )}
                </Button>

                {/* Último ponto registrado */}
                {ultimoPonto && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 size={16} className="text-green-500" />
                        Último registro às <span className="font-semibold text-foreground">{ultimoPonto}</span>
                    </div>
                )}
            </div>
        </div>
    )
}