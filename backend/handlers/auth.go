package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"google.golang.org/api/idtoken"
	"gorm.io/gorm"

	"pontoCerto/config"
	"pontoCerto/models"
)

type AuthHandler struct {
	cfg *config.Config
	db  *gorm.DB
}

func NewAuthHandler(cfg *config.Config, db *gorm.DB) *AuthHandler {
	return &AuthHandler{cfg: cfg, db: db}
}

type googleAuthRequest struct {
	Token string `json:"token"`
}

type jwtClaims struct {
	UserID       uint   `json:"user_id"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	Picture      string `json:"picture"`
	Perfil       string `json:"perfil"`
	Departamento string `json:"departamento"`
	jwt.RegisteredClaims
}

// GoogleLogin valida o token do Google e decide o fluxo:
// - 403 se email não está em nenhuma tabela
// - 200 com "primeiro_acesso: true" se precisa completar cadastro
// - 200 com JWT se login normal
func (h *AuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req googleAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Body inválido", http.StatusBadRequest)
		return
	}

	// 1. Valida token com o Google
	payload, err := idtoken.Validate(context.Background(), req.Token, h.cfg.GoogleClientID)
	if err != nil {
		http.Error(w, "Token inválido", http.StatusUnauthorized)
		return
	}

	googleID := payload.Subject
	email := getStringClaim(payload.Claims, "email")
	name := getStringClaim(payload.Claims, "name")
	picture := getStringClaim(payload.Claims, "picture")

	// 2. Verifica se já é um usuário cadastrado
	var usuario models.Usuario
	result := h.db.Where("google_id = ?", googleID).Preload("Pessoa").First(&usuario)

	if result.Error == nil {
		// Usuário já existe → login normal
		if !usuario.Ativo {
			http.Error(w, "Usuário inativo", http.StatusForbidden)
			return
		}

		// Atualiza foto se mudou
		h.db.Model(&usuario).Update("foto", picture)

		token, err := h.generateJWT(usuario, name)
		if err != nil {
			http.Error(w, "Erro ao gerar token", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(models.AuthResponse{
			Token:   token,
			Name:    name,
			Email:   email,
			Picture: picture,
		})
		return
	}

	// 3. Não é usuário ainda → verifica se está na lista de primeiro acesso
	var primeiroAcesso models.UsuarioPrimeiroAcesso
	err = h.db.Where("email = ?", email).First(&primeiroAcesso).Error

	if err == gorm.ErrRecordNotFound {
		// Email não autorizado
		http.Error(w, "Acesso não autorizado", http.StatusForbidden)
		return
	}
	if err != nil {
		http.Error(w, "Erro interno", http.StatusInternalServerError)
		return
	}

	// 4. Email autorizado → registra data do primeiro login e pede para completar cadastro
	now := time.Now()
	if primeiroAcesso.PrimeiroLoginEm == nil {
		h.db.Model(&primeiroAcesso).Update("primeiro_login_em", now)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"primeiro_acesso": true,
		"email":           email,
		"google_id":       googleID, // ← adicionar
		"name":            name,
		"picture":         picture,
		"cargo":           primeiroAcesso.Cargo,
		"departamento":    primeiroAcesso.Departamento,
	})
}

func (h *AuthHandler) CompletarCadastro(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req models.CompletarCadastroRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Body inválido", http.StatusBadRequest)
		return
	}

	// Verifica se o email ainda está na lista de primeiro acesso
	var primeiroAcesso models.UsuarioPrimeiroAcesso
	if err := h.db.Where("email = ?", req.Email).First(&primeiroAcesso).Error; err != nil {
		http.Error(w, "Acesso não autorizado", http.StatusForbidden)
		return
	}

	// Valida e converte data de nascimento
	dtNasc, err := time.Parse("2006-01-02", req.DtNascimento)
	if err != nil {
		http.Error(w, "Data de nascimento inválida. Use o formato YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	// Cria Pessoa + Usuario em transação
	var usuario models.Usuario
	txErr := h.db.Transaction(func(tx *gorm.DB) error {
		pessoa := models.Pessoa{
			Nome:         req.Nome,
			Sobrenome:    req.Sobrenome,
			CPF:          req.CPF,
			DtNascimento: dtNasc,
		}
		if err := tx.Create(&pessoa).Error; err != nil {
			return err
		}

		usuario = models.Usuario{
			PessoaID:     pessoa.ID,
			GoogleID:     req.GoogleID,
			Email:        req.Email,
			Foto:         req.Picture,
			Cargo:        primeiroAcesso.Cargo,
			Departamento: primeiroAcesso.Departamento,
			Ativo:        true,
		}
		if err := tx.Create(&usuario).Error; err != nil {
			return err
		}

		usuario.Pessoa = pessoa

		// Remove da tabela de primeiro acesso
		return tx.Delete(&primeiroAcesso).Error
	})

	if txErr != nil {
		http.Error(w, "Erro ao criar usuário", http.StatusInternalServerError)
		return
	}

	token, err := h.generateJWT(usuario, req.Nome+" "+req.Sobrenome)
	if err != nil {
		http.Error(w, "Erro ao gerar token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.AuthResponse{
		Token:   token,
		Name:    req.Nome + " " + req.Sobrenome,
		Email:   req.Email,
		Picture: req.Picture,
	})
}

func (h *AuthHandler) generateJWT(usuario models.Usuario, name string) (string, error) {
	claims := jwtClaims{
		UserID:       usuario.ID,
		Name:         name,
		Email:        usuario.Email,
		Picture:      usuario.Foto,
		Perfil:       string(usuario.Perfil),
		Departamento: usuario.Departamento,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(8 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.cfg.JWTSecret))
}

func getStringClaim(claims map[string]interface{}, key string) string {
	if val, ok := claims[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}
