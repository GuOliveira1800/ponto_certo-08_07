import { Navigate, Route, Routes } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import Inicio from './Inicio'
import BaterPonto from './BaterPonto'
import MeusPontos from './MeusPontos'

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Sidebar />

            {/* Conteúdo principal */}
            <main className="
        md:ml-64
        pb-20 md:pb-0
        min-h-screen
      ">
                <div className="p-4 md:p-8">
                    <Routes>
                        <Route index element={<Navigate to="inicio" replace />} />
                        <Route path="inicio" element={<Inicio />} />
                        <Route path="bater-ponto" element={<BaterPonto />} />
                        <Route path="meus-pontos" element={<MeusPontos />} />
                    </Routes>
                </div>
            </main>
        </div>
    )
}