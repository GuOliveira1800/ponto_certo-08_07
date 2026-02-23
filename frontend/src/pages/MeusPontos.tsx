import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Clock, Pencil, AlertCircle } from 'lucide-react'
import { pontoService, RegistroPonto } from '@/services/pontoService'
import { AjustePontoDialog } from '@/components/AjustePontoDialog'
import { toast } from 'sonner'

const MONTHS = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

// Sequência de labels por ordem de batida no dia
const LABELS = ['Entrada', 'Saída almoço', 'Retorno almoço', 'Saída']

function getLabelColor(index: number) {
    const colors = [
        'text-green-500',
        'text-yellow-500',
        'text-blue-500',
        'text-red-500',
    ]
    return colors[index] ?? 'text-muted-foreground'
}

export default function MeusPontos() {
    const today = new Date()

    const [month, setMonth] = useState(today.getMonth() + 1)
    const [year, setYear] = useState(today.getFullYear())
    const [selectedDay, setSelectedDay] = useState<number | null>(null)
    const [pontos, setPontos] = useState<RegistroPonto[]>([])
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()

    const carregarPontos = useCallback(async () => {
        setLoading(true)
        try {
            const data = await pontoService.listarMes(month, year)
            setPontos(data ?? [])
        } catch {
            toast.error('Erro ao carregar pontos')
        } finally {
            setLoading(false)
        }
    }, [month, year])

    useEffect(() => {
        carregarPontos()
        setSelectedDay(null)
    }, [carregarPontos])

    function prevMonth() {
        if (month === 1) { setMonth(12); setYear(y => y - 1) }
        else setMonth(m => m - 1)
    }

    function nextMonth() {
        if (month === 12) { setMonth(1); setYear(y => y + 1) }
        else setMonth(m => m + 1)
    }

    // Agrupa pontos por dia
    function getPontosDoDia(day: number): RegistroPonto[] {
        return pontos.filter((p) => {
            const d = new Date(p.data_ponto)
            return d.getDate() === day && d.getMonth() + 1 === month && d.getFullYear() === year
        })
    }

    const pontosDoDiaSelecionado = selectedDay ? getPontosDoDia(selectedDay) : []

    // Verifica se o dia está completo (4 batidas)
    function isDiaCompleto(day: number) {
        return getPontosDoDia(day).length >= 4
    }

    function isDiaIncompleto(day: number) {
        const qtd = getPontosDoDia(day).length
        return qtd > 0 && qtd < 4
    }

    return (
        <div className="p-6 max-w-lg">
            <h2 className="text-2xl font-bold mb-6">Meus Pontos</h2>

            <div className="bg-card border border-border rounded-2xl p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={prevMonth}>
                        <ChevronLeft size={18} />
                    </Button>
                    <span className="font-semibold">
            {MONTHS[month - 1]} {year}
          </span>
                    <Button variant="ghost" size="icon" onClick={nextMonth}>
                        <ChevronRight size={18} />
                    </Button>
                </div>

                {/* Dias da semana */}
                <div className="grid grid-cols-7 mb-1">
                    {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d) => (
                        <div key={d} className="text-center text-xs text-muted-foreground py-1 font-medium">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Grid de dias */}
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1
                        const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear()
                        const isSelected = selectedDay === day
                        const completo = isDiaCompleto(day)
                        const incompleto = isDiaIncompleto(day)

                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                                className={`
                  aspect-square rounded-lg text-sm font-medium flex flex-col items-center justify-center relative transition-colors
                  ${isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'border border-primary text-primary' : 'hover:bg-accent'}
                `}
                            >
                                {day}
                                {/* Indicador de status */}
                                {completo && (
                                    <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isSelected ? 'bg-primary-foreground' : 'bg-green-500'}`} />
                                )}
                                {incompleto && (
                                    <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isSelected ? 'bg-primary-foreground' : 'bg-yellow-500'}`} />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Legenda */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        Completo
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                        Incompleto
                    </div>
                </div>
            </div>

            {/* Pontos do dia selecionado */}
            {selectedDay && (
                <div className="mt-4 bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">
                            {String(selectedDay).padStart(2, '0')}/{String(month).padStart(2, '0')}/{year}
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setDialogOpen(true)}
                        >
                            <Pencil size={14} />
                            Solicitar ajuste
                        </Button>
                    </div>

                    {loading ? (
                        <p className="text-sm text-muted-foreground">Carregando...</p>
                    ) : pontosDoDiaSelecionado.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {pontosDoDiaSelecionado.map((ponto, idx) => (
                                <div key={ponto.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <Clock size={15} className={getLabelColor(idx)} />
                                        <span className="font-medium">
                      {new Date(ponto.data_ponto).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                      })}
                    </span>
                                        <span className="text-muted-foreground">
                      {LABELS[idx] ?? `Registro ${idx + 1}`}
                    </span>
                                    </div>

                                    {/* Badge de ajuste manual */}
                                    {ponto.incluido_manual && (
                                        <span className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 rounded-full px-2 py-0.5">
                      Ajuste
                    </span>
                                    )}
                                </div>
                            ))}

                            {/* Aviso se dia incompleto */}
                            {pontosDoDiaSelecionado.length < 4 && (
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border text-xs text-yellow-600 dark:text-yellow-400">
                                    <AlertCircle size={13} />
                                    Dia incompleto — {4 - pontosDoDiaSelecionado.length} registro(s) faltando
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-4 text-muted-foreground">
                            <Clock size={32} strokeWidth={1.5} />
                            <p className="text-sm">Nenhum ponto registrado neste dia</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => setDialogOpen(true)}
                            >
                                <Pencil size={14} />
                                Solicitar ajuste
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Dialog de ajuste */}
            <AjustePontoDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSuccess={carregarPontos}
                dia={selectedDay ?? 1}
                mes={month}
                ano={year}
            />
        </div>
    )
}