package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"gorm.io/gorm"

	"pontoCerto/middleware"
	"pontoCerto/models"
)

type PontoHandler struct {
	db *gorm.DB
}

func NewPontoHandler(db *gorm.DB) *PontoHandler {
	return &PontoHandler{db: db}
}

func (h *PontoHandler) Registrar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	user := middleware.GetUser(r)
	agora := time.Now()

	// Verifica se já existe registro no mesmo minuto
	var existente models.RegistroPonto
	inicioMinuto := agora.Truncate(time.Minute)
	fimMinuto := inicioMinuto.Add(time.Minute)

	result := h.db.Where(
		"usuario_id = ? AND data_ponto >= ? AND data_ponto < ? AND ativo = true",
		user.UserID, inicioMinuto, fimMinuto,
	).First(&existente)

	if result.Error == nil {
		http.Error(w, "Já existe um ponto registrado neste minuto", http.StatusConflict)
		return
	}

	// Cria o registro
	ponto := models.RegistroPonto{
		UsuarioID:      user.UserID,
		DataPonto:      agora,
		Ativo:          true,
		IncluidoManual: false,
	}

	if err := h.db.Create(&ponto).Error; err != nil {
		http.Error(w, "Erro ao registrar ponto", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ponto)
}

func (h *PontoHandler) ListarMes(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	user := middleware.GetUser(r)

	mes, _ := strconv.Atoi(r.URL.Query().Get("mes"))
	ano, _ := strconv.Atoi(r.URL.Query().Get("ano"))

	// Defaults para o mês atual
	if mes == 0 {
		mes = int(time.Now().Month())
	}
	if ano == 0 {
		ano = time.Now().Year()
	}

	inicio := time.Date(ano, time.Month(mes), 1, 0, 0, 0, 0, time.Local)
	fim := inicio.AddDate(0, 1, 0)

	var pontos []models.RegistroPonto
	h.db.Where(
		"usuario_id = ? AND data_ponto >= ? AND data_ponto < ? AND ativo = true",
		user.UserID, inicio, fim,
	).Order("data_ponto ASC").Find(&pontos)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pontos)
}

type ajusteRequest struct {
	UsuarioID      *uint     `json:"usuario_id"` // opcional: admin/gestor ajustando outro usuário
	DataPonto      time.Time `json:"data_ponto"`
	MotivoAjusteID uint      `json:"motivo_ajuste_id"`
	Observacao     string    `json:"observacao"`
}

func (h *PontoHandler) CadastrarAjuste(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	user := middleware.GetUser(r)

	var req ajusteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Body inválido", http.StatusBadRequest)
		return
	}

	// Define de quem é o ajuste
	targetUserID := user.UserID

	if req.UsuarioID != nil && *req.UsuarioID != user.UserID {
		// Está ajustando outro usuário — verificar permissão
		if err := h.verificarPermissaoAjuste(user, *req.UsuarioID); err != nil {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		targetUserID = *req.UsuarioID
	}

	// Valida se o motivo existe
	var motivo models.MotivoAjuste
	if err := h.db.First(&motivo, req.MotivoAjusteID).Error; err != nil {
		http.Error(w, "Motivo de ajuste inválido", http.StatusBadRequest)
		return
	}

	// Valida campos obrigatórios
	if req.DataPonto.IsZero() {
		http.Error(w, "Data do ponto é obrigatória", http.StatusBadRequest)
		return
	}
	if req.Observacao == "" {
		http.Error(w, "Observação é obrigatória para ajustes", http.StatusBadRequest)
		return
	}

	ponto := models.RegistroPonto{
		UsuarioID:      targetUserID,
		DataPonto:      req.DataPonto,
		Ativo:          true,
		IncluidoManual: true,
		MotivoAjusteID: &req.MotivoAjusteID,
		Observacao:     req.Observacao,
	}

	if err := h.db.Create(&ponto).Error; err != nil {
		http.Error(w, "Erro ao cadastrar ajuste", http.StatusInternalServerError)
		return
	}

	// Carrega o motivo junto na resposta
	h.db.Preload("MotivoAjuste").First(&ponto, ponto.ID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ponto)
}

func (h *PontoHandler) ListarMotivos(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var motivos []models.MotivoAjuste
	h.db.Where("ativo = true").Find(&motivos)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(motivos)
}

func (h *PontoHandler) verificarPermissaoAjuste(user middleware.UserClaims, targetUserID uint) error {
	// Admin pode tudo
	if user.Perfil == models.PerfilAdmin {
		return nil
	}

	// Gestor só pode ajustar usuários do seu departamento
	if user.Perfil == models.PerfilGestor {
		var target models.Usuario
		if err := h.db.First(&target, targetUserID).Error; err != nil {
			return fmt.Errorf("usuário não encontrado")
		}
		if target.Departamento == user.Departamento {
			return nil
		}
		return fmt.Errorf("gestor só pode ajustar pontos do seu departamento")
	}

	return fmt.Errorf("sem permissão para ajustar ponto de outro usuário")
}
