package models

import "time"

type MotivoAjuste struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Descricao string    `gorm:"type:varchar(100);not null;uniqueIndex" json:"descricao"`
	Ativo     bool      `gorm:"default:true" json:"ativo"`
	CriadoEm  time.Time `gorm:"autoCreateTime" json:"criado_em"`
}

func (MotivoAjuste) TableName() string {
	return "motivos_ajuste"
}
