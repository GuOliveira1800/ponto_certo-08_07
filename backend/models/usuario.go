package models

import "time"

type PerfilUsuario string

const (
	PerfilAdmin       PerfilUsuario = "admin"
	PerfilGestor      PerfilUsuario = "gestor"
	PerfilFuncionario PerfilUsuario = "funcionario"
)

type Usuario struct {
	ID           uint          `gorm:"primaryKey;autoIncrement" json:"id"`
	PessoaID     uint          `gorm:"not null;index" json:"pessoa_id"`
	Pessoa       Pessoa        `gorm:"foreignKey:PessoaID" json:"pessoa,omitempty"`
	GoogleID     string        `gorm:"type:varchar(100);uniqueIndex;not null" json:"google_id"`
	Email        string        `gorm:"type:varchar(150);uniqueIndex;not null" json:"email"`
	Foto         string        `gorm:"type:varchar(500)" json:"foto"`
	Cargo        string        `gorm:"type:varchar(100)" json:"cargo"`
	Departamento string        `gorm:"type:varchar(100)" json:"departamento"`
	Perfil       PerfilUsuario `gorm:"type:varchar(20);default:'funcionario'" json:"perfil"`
	Ativo        bool          `gorm:"default:true" json:"ativo"`
	CriadoEm     time.Time     `gorm:"autoCreateTime" json:"criado_em"`
	AtualizadoEm time.Time     `gorm:"autoUpdateTime" json:"atualizado_em"`
}

func (Usuario) TableName() string {
	return "usuarios"
}
