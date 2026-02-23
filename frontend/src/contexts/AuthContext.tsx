import { createContext, useContext, useState, type ReactNode } from 'react'
import axios from 'axios'

interface User {
    name: string
    email: string
    picture: string
    token: string
}

export interface PrimeiroAcessoData {
    email: string
    name: string
    picture: string
    cargo: string
    departamento: string
    google_id: string
}

interface AuthContextType {
    user: User | null
    loginWithGoogle: (googleToken: string) => Promise<{ primeiro_acesso: boolean; dados?: PrimeiroAcessoData }>
    completarCadastro: (dados: {
        email: string
        google_id: string
        picture: string
        nome: string
        sobrenome: string
        cpf: string
        dt_nascimento: string
    }) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('user')
        return stored ? JSON.parse(stored) : null
    })

    async function loginWithGoogle(googleToken: string): Promise<{ primeiro_acesso: boolean; dados?: PrimeiroAcessoData }> {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/google`, {
            token: googleToken,
        })

        if (data.primeiro_acesso) {
            return { primeiro_acesso: true, dados: data as PrimeiroAcessoData }
        }

        setUser(data)
        localStorage.setItem('user', JSON.stringify(data))
        return { primeiro_acesso: false }
    }

    async function completarCadastro(dados: {
        email: string
        google_id: string
        picture: string
        nome: string
        sobrenome: string
        cpf: string
        dt_nascimento: string
    }) {
        const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/google/completar-cadastro`,
            dados
        )
        setUser(data)
        localStorage.setItem('user', JSON.stringify(data))
    }

    function logout() {
        setUser(null)
        localStorage.removeItem('user')
    }

    return (
        <AuthContext.Provider value={{ user, loginWithGoogle, completarCadastro, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)