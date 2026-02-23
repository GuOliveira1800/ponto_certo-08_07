package database

import (
	"log"

	"gorm.io/gorm"
	"pontoCerto/models"
)

func Seed(db *gorm.DB) {
	motivos := []models.MotivoAjuste{
		{Descricao: "Esquecimento"},
		{Descricao: "Consulta Médica"},
		{Descricao: "Day Off"},
	}

	for _, m := range motivos {
		// Insere apenas se não existir
		result := db.Where("descricao = ?", m.Descricao).FirstOrCreate(&m)
		if result.Error != nil {
			log.Printf("Erro ao criar motivo '%s': %v", m.Descricao, result.Error)
		}
	}

	log.Println("Seed de motivos executado!")
}
