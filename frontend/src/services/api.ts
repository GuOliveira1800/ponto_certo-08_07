import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

// Injeta o token JWT em todas as requisições
api.interceptors.request.use((config) => {
    const user = localStorage.getItem('user')
    if (user) {
        const { token } = JSON.parse(user)
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Se o token expirar, redireciona para login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api