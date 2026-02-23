package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"pontoCerto/models"
)

type contextKey string

const UserKey contextKey = "user"

type UserClaims struct {
	UserID       uint
	Name         string
	Email        string
	Picture      string
	Perfil       models.PerfilUsuario
	Departamento string
}

func AuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				http.Error(w, "Token não informado", http.StatusUnauthorized)
				return
			}

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(jwtSecret), nil
			})

			if err != nil || !token.Valid {
				http.Error(w, "Token inválido", http.StatusUnauthorized)
				return
			}

			claims := token.Claims.(jwt.MapClaims)
			user := UserClaims{
				UserID:       uint(claims["user_id"].(float64)),
				Name:         claims["name"].(string),
				Email:        claims["email"].(string),
				Picture:      claims["picture"].(string),
				Perfil:       models.PerfilUsuario(claims["perfil"].(string)),
				Departamento: claims["departamento"].(string),
			}

			ctx := context.WithValue(r.Context(), UserKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUser(r *http.Request) UserClaims {
	return r.Context().Value(UserKey).(UserClaims)
}

// Helpers de perfil para usar nos handlers
func IsAdmin(r *http.Request) bool {
	return GetUser(r).Perfil == models.PerfilAdmin
}

func IsGestor(r *http.Request) bool {
	u := GetUser(r)
	return u.Perfil == models.PerfilGestor || u.Perfil == models.PerfilAdmin
}
