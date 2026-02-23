package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	GoogleClientID string
	JWTSecret      string
	Port           string
	DatabaseDSN    string // para o GORM
	DatabaseURL    string // para o golang-migrate
	IsProd         bool
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("Arquivo .env não encontrado, usando variáveis de ambiente do sistema")
	}

	databaseURL := os.Getenv("DATABASE_URL")

	// Se DATABASE_URL estiver definida (produção/Railway/Neon), usa ela diretamente.
	// Caso contrário, monta o DSN a partir das variáveis individuais (desenvolvimento local).
	var dsn string
	if databaseURL != "" {
		dsn = databaseURL
	} else {
		dsn = fmt.Sprintf(
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
			os.Getenv("DB_HOST"),
			os.Getenv("DB_PORT"),
			os.Getenv("DB_USER"),
			os.Getenv("DB_PASSWORD"),
			os.Getenv("DB_NAME"),
			os.Getenv("DB_SSLMODE"),
		)
	}

	return &Config{
		GoogleClientID: os.Getenv("GOOGLE_CLIENT_ID"),
		JWTSecret:      os.Getenv("JWT_SECRET"),
		Port:           getEnvOrDefault("PORT", "8080"),
		DatabaseDSN:    dsn,
		DatabaseURL:    databaseURL,
		IsProd:         os.Getenv("APP_ENV") == "production",
	}
}

func getEnvOrDefault(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
