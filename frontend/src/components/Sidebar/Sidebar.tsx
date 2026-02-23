import { NavLink } from 'react-router-dom'
import { Home, Clock, Calendar, Sun, Moon, LogOut } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

const navItems = [
    { to: '/inicio',      icon: Home,     label: 'Início' },
    { to: '/bater-ponto', icon: Clock,    label: 'Bater Ponto' },
    { to: '/meus-pontos', icon: Calendar, label: 'Meus Pontos' },
]

export function Sidebar() {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()

    const initials = user?.name
        ?.split(' ')
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase() || 'U'

    return (
        <>
            {/* ── SIDEBAR DESKTOP ── */}
            <aside className="hidden md:flex flex-col w-64 h-screen bg-card border-r border-border px-4 py-6 fixed left-0 top-0 z-40">
                {/* Logo */}
                <div className="mb-8 px-2">
                    <h1 className="text-xl font-bold text-primary">PontoCerto</h1>
                    <p className="text-xs text-muted-foreground">Sistema de marcação de ponto</p>
                </div>

                {/* Nav */}
                <nav className="flex flex-col gap-1 flex-1">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                }`
                            }
                        >
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors w-full text-left">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={user?.picture} />
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium truncate">{user?.name}</span>
                                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" className="w-52">
                        <DropdownMenuItem onClick={toggleTheme}>
                            {theme === 'dark' ? <Sun size={16} className="mr-2" /> : <Moon size={16} className="mr-2" />}
                            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                            <LogOut size={16} className="mr-2" />
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </aside>

            {/* ── BOTTOM BAR MOBILE ── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center justify-around px-2 py-2">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${isActive
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            }`
                        }
                    >
                        <Icon size={22} />
                        {label}
                    </NavLink>
                ))}

                {/* User no mobile */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-xs font-medium text-muted-foreground">
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={user?.picture} />
                                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="max-w-[60px] truncate">{user?.name?.split(' ')[0]}</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="end" className="w-48">
                        <DropdownMenuItem onClick={toggleTheme}>
                            {theme === 'dark' ? <Sun size={16} className="mr-2" /> : <Moon size={16} className="mr-2" />}
                            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                            <LogOut size={16} className="mr-2" />
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </nav>
        </>
    )
}