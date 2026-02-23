package database

import (
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func RunMigrations(databaseURL string) {
	m, err := migrate.New(
		"file:///app/database/migrations", // caminho absoluto no container
		databaseURL,                       // DATABASE_URL direto, sem o extractDSN
	)
	if err != nil {
		log.Fatalf("Erro ao inicializar migrations: %v", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Erro ao executar migrations: %v", err)
	}

	log.Println("Migrations executadas com sucesso!")
}

// Converte "host=x port=x user=x ..." para "x:senha@localhost:5432/dbname"
func extractDSN(gormDSN string) string {
	// O golang-migrate aceita a URL completa do postgres
	// Vamos usar diretamente a DATABASE_URL no formato URL
	return gormDSN
}
