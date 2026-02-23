package main

import (
	"log"
	"net/http"

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

	// Rotas protegidas
	protected := http.NewServeMux()
	protected.HandleFunc("/ponto/registrar", pontoHandler.Registrar)
	protected.HandleFunc("/ponto/mes", pontoHandler.ListarMes)
	protected.HandleFunc("/ponto/ajuste", pontoHandler.CadastrarAjuste)
	protected.HandleFunc("/ponto/motivos", pontoHandler.ListarMotivos)

	mux.Handle("/api/", middleware.AuthMiddleware(cfg.JWTSecret)(
		http.StripPrefix("/api", protected),
	))

	mux.HandleFunc("/auth/google/completar-cadastro", authHandler.CompletarCadastro)

	log.Printf("Servidor rodando na porta %s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, corsMiddleware(mux)))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
