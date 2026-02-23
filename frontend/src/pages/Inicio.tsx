import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Briefcase, Building2, User } from 'lucide-react'

export default function Inicio() {
    const { user } = useAuth()

    // Futuramente virá do backend
    const info = {
        age: 28,
        department: 'Tecnologia',
        role: 'Desenvolvedor Frontend',
    }

    const initials = user?.name
        ?.split(' ')
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase() || 'U'

    return (
        <div className="p-6 max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">Início</h2>

            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Avatar className="w-24 h-24 text-2xl">
                    <AvatarImage src={user?.picture} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-3 text-center sm:text-left">
                    <div>
                        <h3 className="text-xl font-semibold">{user?.name}</h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm">
                            <User size={16} className="text-primary" />
                            <span className="text-muted-foreground">Idade:</span>
                            <span className="font-medium">{info.age} anos</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Building2 size={16} className="text-primary" />
                            <span className="text-muted-foreground">Departamento:</span>
                            <span className="font-medium">{info.department}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Briefcase size={16} className="text-primary" />
                            <span className="text-muted-foreground">Cargo:</span>
                            <span className="font-medium">{info.role}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}