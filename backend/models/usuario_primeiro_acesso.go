package models

import "time"

type UsuarioPrimeiroAcesso struct {
	ID              uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Email           string     `gorm:"type:varchar(150);uniqueIndex;not null" json:"email"`
	Cargo           string     `gorm:"type:varchar(100);not null" json:"cargo"`
	Departamento    string     `gorm:"type:varchar(100);not null" json:"departamento"`
	CriadoEm        time.Time  `gorm:"autoCreateTime" json:"criado_em"`
	PrimeiroLoginEm *time.Time `gorm:"default:null" json:"primeiro_login_em"`
}

func (UsuarioPrimeiroAcesso) TableName() string {
	return "usuario_primeiro_acesso"
}

type CompletarCadastroRequest struct {
	Email        string `json:"email"`
	GoogleID     string `json:"google_id"`
	Picture      string `json:"picture"`
	Nome         string `json:"nome"`
	Sobrenome    string `json:"sobrenome"`
	CPF          string `json:"cpf"`
	DtNascimento string `json:"dt_nascimento"`
}
