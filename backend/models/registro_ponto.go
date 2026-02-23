package models

import "time"

type RegistroPonto struct {
	ID             uint          `gorm:"primaryKey;autoIncrement" json:"id"`
	UsuarioID      uint          `gorm:"not null;index" json:"usuario_id"`
	Usuario        Usuario       `gorm:"foreignKey:UsuarioID" json:"usuario,omitempty"`
	DataPonto      time.Time     `gorm:"not null" json:"data_ponto"`
	Ativo          bool          `gorm:"default:true" json:"ativo"`
	IncluidoManual bool          `gorm:"default:false" json:"incluido_manual"`
	MotivoAjusteID *uint         `gorm:"index" json:"motivo_ajuste_id,omitempty"`
	MotivoAjuste   *MotivoAjuste `gorm:"foreignKey:MotivoAjusteID" json:"motivo_ajuste,omitempty"`
	Observacao     string        `gorm:"type:text" json:"observacao"`
	CriadoEm       time.Time     `gorm:"autoCreateTime" json:"criado_em"`
	AtualizadoEm   time.Time     `gorm:"autoUpdateTime" json:"atualizado_em"`
}

func (RegistroPonto) TableName() string {
	return "registros_ponto"
}
