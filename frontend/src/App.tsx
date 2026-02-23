import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import PrivateRoute from '@/components/PrivateRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import PrimeiroAcesso from '@/pages/PrimeiroAcesso'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
                        <Route
                            path="/*"
                            element={
                                <PrivateRoute>
                                    <Dashboard />
                                </PrivateRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/inicio" replace />} />
                    </Routes>
                    <Toaster />
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    )
}