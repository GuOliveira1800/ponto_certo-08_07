package models

import "time"

type Pessoa struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Nome         string    `gorm:"type:varchar(100);not null" json:"nome"`
	Sobrenome    string    `gorm:"type:varchar(100);not null" json:"sobrenome"`
	CPF          string    `gorm:"type:varchar(14);uniqueIndex;not null" json:"cpf"`
	DtNascimento time.Time `gorm:"type:date;not null" json:"dt_nascimento"`
	CriadoEm     time.Time `gorm:"autoCreateTime" json:"criado_em"`
	AtualizadoEm time.Time `gorm:"autoUpdateTime" json:"atualizado_em"`
}

func (Pessoa) TableName() string {
	return "pessoas"
}
