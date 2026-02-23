package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"pontoCerto/config"
	"pontoCerto/database"
	"pontoCerto/handlers"
	"pontoCerto/middleware"
)

func main() {
	cfg := config.Load()

	db := database.Connect(cfg)
	database.Seed(db)

	authHandler := handlers.NewAuthHandler(cfg, db)
	pontoHandler := handlers.NewPontoHandler(db)

	mux := http.NewServeMux()

	// Rotas públicas
	mux.HandleFunc("/auth/google", authHandler.GoogleLogin)
	mux.HandleFunc("/auth/google/completar-cadastro", authHandler.CompletarCadastro)

	// Rotas protegidas
	protected := http.NewServeMux()
	protected.HandleFunc("/ponto/registrar", pontoHandler.Registrar)
	protected.HandleFunc("/ponto/mes", pontoHandler.ListarMes)
	protected.HandleFunc("/ponto/ajuste", pontoHandler.CadastrarAjuste)
	protected.HandleFunc("/ponto/motivos", pontoHandler.ListarMotivos)

	mux.Handle("/api/", middleware.AuthMiddleware(cfg.JWTSecret)(
		http.StripPrefix("/api", protected),
	))

	log.Printf("Servidor rodando na porta %s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, corsMiddleware(mux)))
}

func corsMiddleware(next http.Handler) http.Handler {
	// Lê origens permitidas da variável de ambiente ALLOWED_ORIGINS
	// Exemplo: "https://meusite.up.railway.app,http://localhost:5173"
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")

	origins := map[string]bool{}
	for _, o := range strings.Split(allowedOrigins, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			origins[o] = true
		}
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if origins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else if len(origins) == 0 {
			// Se não configurou nada, permite tudo (fallback dev)
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
