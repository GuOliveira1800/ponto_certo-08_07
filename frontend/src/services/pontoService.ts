import api from './api'

export interface RegistroPonto {
    id: number
    usuario_id: number
    data_ponto: string
    ativo: boolean
    incluido_manual: boolean
    motivo_ajuste_id?: number
    motivo_ajuste?: { id: number; descricao: string }
    observacao?: string
    criado_em: string
}

export interface MotivoAjuste {
    id: number
    descricao: string
    ativo: boolean
}

export interface AjusteRequest {
    usuario_id?: number
    data_ponto: string
    motivo_ajuste_id: number
    observacao: string
}

export const pontoService = {
    async registrar(): Promise<RegistroPonto> {
        const { data } = await api.post('/api/ponto/registrar')
        return data
    },

    async listarMes(mes: number, ano: number): Promise<RegistroPonto[]> {
        const { data } = await api.get('/api/ponto/mes', { params: { mes, ano } })
        return data
    },

    async cadastrarAjuste(payload: AjusteRequest): Promise<RegistroPonto> {
        const { data } = await api.post('/api/ponto/ajuste', payload)
        return data
    },

    async listarMotivos(): Promise<MotivoAjuste[]> {
        const { data } = await api.get('/api/ponto/motivos')
        return data
    },
}