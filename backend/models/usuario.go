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
	PessoaID     uint          `gorm:"default:0;index" json:"pessoa_id"` // 0 = cadastro incompleto
	Pessoa       Pessoa        `gorm:"foreignKey:PessoaID" json:"pessoa,omitempty"`
	GoogleID     string        `gorm:"type:varchar(100);uniqueIndex;default:''" json:"google_id"`
	Username     string        `gorm:"type:varchar(100);uniqueIndex;default:''" json:"username"` // login por senha
	PasswordHash string        `gorm:"type:varchar(255);default:''" json:"-"`                    // nunca expõe no JSON
	Email        string        `gorm:"type:varchar(150);uniqueIndex;default:''" json:"email"`
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
