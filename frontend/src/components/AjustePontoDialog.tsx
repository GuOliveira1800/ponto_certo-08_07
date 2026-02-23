import { useState, useEffect } from 'react'
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { pontoService, MotivoAjuste, AjusteRequest } from '@/services/pontoService'
import { toast } from 'sonner'

interface Props {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    dia: number
    mes: number
    ano: number
    hora?: string // se for ajustar uma hora específica
}

export function AjustePontoDialog({ open, onClose, onSuccess, dia, mes, ano, hora }: Props) {
    const [motivos, setMotivos] = useState<MotivoAjuste[]>([])
    const [motivoId, setMotivoId] = useState<string>('')
    const [observacao, setObservacao] = useState('')
    const [horario, setHorario] = useState(hora || '')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            pontoService.listarMotivos().then(setMotivos)
            setMotivoId('')
            setObservacao('')
            setHorario(hora || '')
        }
    }, [open, hora])

    async function handleSubmit() {
        if (!motivoId || !observacao.trim() || !horario) {
            toast.error('Preencha todos os campos')
            return
        }

        // Monta a data completa com o horário informado
        const [h, m] = horario.split(':')
        const dataPonto = new Date(ano, mes - 1, dia, Number(h), Number(m), 0)

        const payload: AjusteRequest = {
            data_ponto: dataPonto.toISOString(),
            motivo_ajuste_id: Number(motivoId),
            observacao: observacao.trim(),
        }

        setLoading(true)
        try {
            await pontoService.cadastrarAjuste(payload)
            toast.success('Ajuste registrado com sucesso!')
            onSuccess()
            onClose()
        } catch {
            toast.error('Erro ao registrar ajuste')
        } finally {
            setLoading(false)
        }
    }

    const dataFormatada = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Solicitar ajuste de ponto</DialogTitle>
                    <p className="text-sm text-muted-foreground">Dia {dataFormatada}</p>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    {/* Horário */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Horário</label>
                        <input
                            type="time"
                            value={horario}
                            onChange={(e) => setHorario(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    {/* Motivo */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Motivo</label>
                        <Select value={motivoId} onValueChange={setMotivoId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o motivo" />
                            </SelectTrigger>
                            <SelectContent>
                                {motivos.map((m) => (
                                    <SelectItem key={m.id} value={String(m.id)}>
                                        {m.descricao}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Observação */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Observação</label>
                        <textarea
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            placeholder="Descreva o motivo do ajuste..."
                            rows={3}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 animate-spin" size={16} />}
                        Confirmar ajuste
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}