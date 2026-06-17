package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"aquabook/internal/service"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/facebook"
	"golang.org/x/oauth2/google"
)

type OAuthHandler struct {
	authService    *service.AuthService
	googleConfig   *oauth2.Config
	facebookConfig *oauth2.Config
	frontendURL    string
}

func NewOAuthHandler(authService *service.AuthService, googleClientID, googleSecret, facebookClientID, facebookSecret, backendURL, frontendURL string) *OAuthHandler {
	googleConfig := &oauth2.Config{
		ClientID:     googleClientID,
		ClientSecret: googleSecret,
		RedirectURL:  backendURL + "/api/auth/google/callback",
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}

	facebookConfig := &oauth2.Config{
		ClientID:     facebookClientID,
		ClientSecret: facebookSecret,
		RedirectURL:  backendURL + "/api/auth/facebook/callback",
		Scopes:       []string{"email", "public_profile"},
		Endpoint:     facebook.Endpoint,
	}

	return &OAuthHandler{
		authService:    authService,
		googleConfig:   googleConfig,
		facebookConfig: facebookConfig,
		frontendURL:    frontendURL,
	}
}

func (h *OAuthHandler) RegisterRoutes(app *fiber.App) {
	auth := app.Group("/api/auth")
	auth.Get("/google", h.GoogleLogin)
	auth.Get("/google/callback", h.GoogleCallback)
	auth.Get("/facebook", h.FacebookLogin)
	auth.Get("/facebook/callback", h.FacebookCallback)
}

// GoogleLogin redirects user to Google's OAuth consent screen
func (h *OAuthHandler) GoogleLogin(c *fiber.Ctx) error {
	if h.googleConfig.ClientID == "" {
		return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
			"error": "Google OAuth not configured",
		})
	}
	url := h.googleConfig.AuthCodeURL("state", oauth2.AccessTypeOnline)
	return c.Redirect(url)
}

// GoogleCallback handles the OAuth callback from Google
func (h *OAuthHandler) GoogleCallback(c *fiber.Ctx) error {
	code := c.Query("code")
	if code == "" {
		return c.Redirect(h.frontendURL + "/login?error=oauth_failed")
	}

	token, err := h.googleConfig.Exchange(context.Background(), code)
	if err != nil {
		return c.Redirect(h.frontendURL + "/login?error=oauth_failed")
	}

	// Get user info from Google
	userInfo, err := getGoogleUserInfo(token.AccessToken)
	if err != nil {
		return c.Redirect(h.frontendURL + "/login?error=oauth_failed")
	}

	user, tokens, err := h.authService.LoginWithOAuth(
		c.Context(),
		"google",
		userInfo["id"],
		userInfo["email"],
		userInfo["name"],
		userInfo["picture"],
	)
	if err != nil {
		return c.Redirect(h.frontendURL + "/login?error=oauth_failed")
	}

	_ = user
	return c.Redirect(fmt.Sprintf("%s/auth/callback?access_token=%s&refresh_token=%s",
		h.frontendURL, tokens.AccessToken, tokens.RefreshToken))
}

// FacebookLogin redirects user to Facebook's OAuth consent screen
func (h *OAuthHandler) FacebookLogin(c *fiber.Ctx) error {
	if h.facebookConfig.ClientID == "" {
		return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
			"error": "Facebook OAuth not configured",
		})
	}
	url := h.facebookConfig.AuthCodeURL("state", oauth2.AccessTypeOnline)
	return c.Redirect(url)
}

// FacebookCallback handles the OAuth callback from Facebook
func (h *OAuthHandler) FacebookCallback(c *fiber.Ctx) error {
	code := c.Query("code")
	if code == "" {
		return c.Redirect(h.frontendURL + "/login?error=oauth_failed")
	}

	token, err := h.facebookConfig.Exchange(context.Background(), code)
	if err != nil {
		return c.Redirect(h.frontendURL + "/login?error=oauth_failed")
	}

	userInfo, err := getFacebookUserInfo(token.AccessToken)
	if err != nil {
		return c.Redirect(h.frontendURL + "/login?error=oauth_failed")
	}

	user, tokens, err := h.authService.LoginWithOAuth(
		c.Context(),
		"facebook",
		userInfo["id"],
		userInfo["email"],
		userInfo["name"],
		userInfo["picture"],
	)
	if err != nil {
		return c.Redirect(h.frontendURL + "/login?error=oauth_failed")
	}

	_ = user
	return c.Redirect(fmt.Sprintf("%s/auth/callback?access_token=%s&refresh_token=%s",
		h.frontendURL, tokens.AccessToken, tokens.RefreshToken))
}

func getGoogleUserInfo(accessToken string) (map[string]string, error) {
	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, err
	}

	result := map[string]string{
		"id":      getString(data, "id"),
		"email":   getString(data, "email"),
		"name":    getString(data, "name"),
		"picture": getString(data, "picture"),
	}
	return result, nil
}

func getFacebookUserInfo(accessToken string) (map[string]string, error) {
	url := "https://graph.facebook.com/me?fields=id,name,email,picture&access_token=" + accessToken
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, err
	}

	picture := ""
	if pic, ok := data["picture"].(map[string]interface{}); ok {
		if picData, ok := pic["data"].(map[string]interface{}); ok {
			picture = getString(picData, "url")
		}
	}

	result := map[string]string{
		"id":      getString(data, "id"),
		"email":   getString(data, "email"),
		"name":    getString(data, "name"),
		"picture": picture,
	}
	return result, nil
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}
