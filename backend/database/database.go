package database

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"pontoCerto/config"
	"pontoCerto/models"
)

var DB *gorm.DB

func Connect(cfg *config.Config) *gorm.DB {
	db, err := gorm.Open(postgres.Open(cfg.DatabaseDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Erro ao conectar no banco de dados: %v", err)
	}

	log.Println("Banco de dados conectado!")

	if cfg.IsProd {
		// Produção: usa migrations versionadas
		RunMigrations(cfg.DatabaseURL)
	} else {
		// Dev: AutoMigrate para agilidade
		err = db.AutoMigrate(
			&models.Pessoa{},
			&models.Usuario{},
			&models.MotivoAjuste{},
			&models.RegistroPonto{},
			&models.UsuarioPrimeiroAcesso{},
		)
		if err != nil {
			log.Fatalf("Erro no AutoMigrate: %v", err)
		}
		log.Println("AutoMigrate executado (modo dev)!")
	}

	DB = db
	return db
}
