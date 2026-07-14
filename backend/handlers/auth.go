package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"
	"unicode"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
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

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type registerRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
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

// Login autentica um usuário com username e senha.
// - 401 se credenciais inválidas
// - 403 se usuário inativo
// - 200 com JWT se ok
// - 200 com "primeiro_acesso: true" se cadastro incompleto (sem Pessoa vinculada)
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Username == "" || req.Password == "" {
		http.Error(w, "Body inválido", http.StatusBadRequest)
		return
	}

	var usuario models.Usuario
	result := h.db.Where("username = ?", req.Username).Preload("Pessoa").First(&usuario)
	if result.Error != nil {
		http.Error(w, "Usuário ou senha incorretos", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(usuario.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "Usuário ou senha incorretos", http.StatusUnauthorized)
		return
	}

	if !usuario.Ativo {
		http.Error(w, "Usuário inativo", http.StatusForbidden)
		return
	}

	// Cadastro incompleto → primeiro acesso
	if usuario.PessoaID == 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"primeiro_acesso": true,
			"dados": map[string]interface{}{
				"email":        usuario.Email,
				"google_id":    "",
				"name":         usuario.Username,
				"picture":      usuario.Foto,
				"cargo":        usuario.Cargo,
				"departamento": usuario.Departamento,
			},
		})
		return
	}

	displayName := usuario.Username
	if usuario.Pessoa.ID != 0 {
		displayName = usuario.Pessoa.Nome + " " + usuario.Pessoa.Sobrenome
	}

	token, err := h.generateJWT(usuario, displayName)
	if err != nil {
		http.Error(w, "Erro ao gerar token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.AuthResponse{
		Token:   token,
		Name:    displayName,
		Email:   usuario.Email,
		Picture: usuario.Foto,
	})
}

// Register cria um novo usuário com username e senha.
// O usuário fica com PessoaID = 0 até completar o primeiro acesso.
// - 409 se username já existe
// - 400 se senha não atende aos requisitos
// - 201 com sucesso
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Username == "" || req.Password == "" {
		http.Error(w, "Body inválido", http.StatusBadRequest)
		return
	}

	if !isPasswordValid(req.Password) {
		http.Error(w, "A senha deve ter no mínimo 8 caracteres, 1 maiúscula, 1 número e 1 caractere especial", http.StatusBadRequest)
		return
	}

	// Verifica se username já existe
	var count int64
	h.db.Model(&models.Usuario{}).Where("username = ?", req.Username).Count(&count)
	if count > 0 {
		http.Error(w, "Nome de usuário já está em uso", http.StatusConflict)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Erro interno", http.StatusInternalServerError)
		return
	}

	usuario := models.Usuario{
		Username:     req.Username,
		PasswordHash: string(hash),
		Ativo:        true,
		// PessoaID = 0 → indica cadastro incompleto
	}
	if err := h.db.Create(&usuario).Error; err != nil {
		http.Error(w, "Erro ao criar usuário", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Usuário criado com sucesso"})
}

// GoogleLogin valida o token do Google e decide o fluxo:
// - 200 com JWT se o email já existe na tabela usuario
// - 200 com "primeiro_acesso: true" se o email NÃO existe (qualquer conta Google pode tentar)
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

	// 2. Verifica se já é um usuário cadastrado (google_id ou email)
	var usuario models.Usuario
	result := h.db.Where("google_id = ? OR email = ?", googleID, email).Preload("Pessoa").First(&usuario)

	if result.Error == nil {
		// Usuário existe
		if !usuario.Ativo {
			http.Error(w, "Usuário inativo", http.StatusForbidden)
			return
		}

		// Atualiza google_id e foto se necessário
		updates := map[string]interface{}{"foto": picture}
		if usuario.GoogleID == "" {
			updates["google_id"] = googleID
		}
		h.db.Model(&usuario).Updates(updates)

		// Cadastro incompleto → primeiro acesso
		if usuario.PessoaID == 0 {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"primeiro_acesso": true,
				"dados": map[string]interface{}{
					"email":        email,
					"google_id":    googleID,
					"name":         name,
					"picture":      picture,
					"cargo":        usuario.Cargo,
					"departamento": usuario.Departamento,
				},
			})
			return
		}

		displayName := name
		if usuario.Pessoa.ID != 0 {
			displayName = usuario.Pessoa.Nome + " " + usuario.Pessoa.Sobrenome
		}

		token, err := h.generateJWT(usuario, displayName)
		if err != nil {
			http.Error(w, "Erro ao gerar token", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(models.AuthResponse{
			Token:   token,
			Name:    displayName,
			Email:   email,
			Picture: picture,
		})
		return
	}

	// 3. Email/Google não encontrado → direciona para primeiro acesso
	// (verifica se existe na tabela de pré-cadastro para preencher cargo/departamento)
	var cargo, departamento string
	var primeiroAcessoPre models.UsuarioPrimeiroAcesso
	if err := h.db.Where("email = ?", email).First(&primeiroAcessoPre).Error; err == nil {
		cargo = primeiroAcessoPre.Cargo
		departamento = primeiroAcessoPre.Departamento
		now := time.Now()
		if primeiroAcessoPre.PrimeiroLoginEm == nil {
			h.db.Model(&primeiroAcessoPre).Update("primeiro_login_em", now)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"primeiro_acesso": true,
		"dados": map[string]interface{}{
			"email":        email,
			"google_id":    googleID,
			"name":         name,
			"picture":      picture,
			"cargo":        cargo,
			"departamento": departamento,
		},
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

	dtNasc, err := time.Parse("2006-01-02", req.DtNascimento)
	if err != nil {
		http.Error(w, "Data de nascimento inválida. Use o formato YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	var usuario models.Usuario

	// Tenta encontrar usuário existente (cadastro via registro ou Google prévio)
	findResult := h.db.Where("google_id = ? OR email = ?", req.GoogleID, req.Email).First(&usuario)
	userExists := findResult.Error == nil

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

		if userExists {
			// Atualiza usuário existente com dados completos
			updates := map[string]interface{}{
				"pessoa_id": pessoa.ID,
			}
			if req.GoogleID != "" && usuario.GoogleID == "" {
				updates["google_id"] = req.GoogleID
			}
			if usuario.Email == "" && req.Email != "" {
				updates["email"] = req.Email
			}
			if usuario.Foto == "" && req.Picture != "" {
				updates["foto"] = req.Picture
			}
			if err := tx.Model(&usuario).Updates(updates).Error; err != nil {
				return err
			}
			usuario.Pessoa = pessoa
		} else {
			// Cria novo usuário (veio pelo Google sem pré-cadastro)
			// Busca cargo/departamento da tabela de pré-acesso, se existir
			var cargo, departamento string
			var prePre models.UsuarioPrimeiroAcesso
			if tx.Where("email = ?", req.Email).First(&prePre).Error == nil {
				cargo = prePre.Cargo
				departamento = prePre.Departamento
			}

			usuario = models.Usuario{
				PessoaID:     pessoa.ID,
				GoogleID:     req.GoogleID,
				Email:        req.Email,
				Foto:         req.Picture,
				Cargo:        cargo,
				Departamento: departamento,
				Ativo:        true,
			}
			if err := tx.Create(&usuario).Error; err != nil {
				return err
			}
			usuario.Pessoa = pessoa
		}

		// Remove da tabela de pré-acesso se existir
		tx.Where("email = ?", req.Email).Delete(&models.UsuarioPrimeiroAcesso{})
		return nil
	})

	if txErr != nil {
		http.Error(w, "Erro ao criar usuário", http.StatusInternalServerError)
		return
	}

	displayName := req.Nome + " " + req.Sobrenome
	token, err := h.generateJWT(usuario, displayName)
	if err != nil {
		http.Error(w, "Erro ao gerar token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.AuthResponse{
		Token:   token,
		Name:    displayName,
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

// isPasswordValid garante: 8+ chars, 1 maiúscula, 1 número, 1 especial
func isPasswordValid(password string) bool {
	if len(password) < 8 {
		return false
	}
	var hasUpper, hasNumber, hasSpecial bool
	for _, c := range password {
		switch {
		case unicode.IsUpper(c):
			hasUpper = true
		case unicode.IsDigit(c):
			hasNumber = true
		case !unicode.IsLetter(c) && !unicode.IsDigit(c):
			hasSpecial = true
		}
	}
	return hasUpper && hasNumber && hasSpecial
}

func getStringClaim(claims map[string]interface{}, key string) string {
	if val, ok := claims[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}
