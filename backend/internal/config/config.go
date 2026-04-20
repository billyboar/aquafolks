package config

import (
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
	RedisURL    string
	JWTSecret   string

	// Storage
	S3Endpoint  string
	S3AccessKey string
	S3SecretKey string
	S3Bucket    string

	// Email
	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
	FromName     string

	// Frontend
	FrontendURL string

	// OAuth
	GoogleClientID     string
	GoogleClientSecret string
	DiscordClientID    string
	DiscordSecret      string
	FacebookClientID   string
	FacebookSecret     string

	// Environment
	Environment string // dev, staging, production
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "3000"),
		DatabaseURL: getEnv("DATABASE_URL", ""),
		RedisURL:    getEnv("REDIS_URL", "localhost:6379"),
		JWTSecret:   getEnv("JWT_SECRET", "change-me-in-production"),

		S3Endpoint:  getEnv("S3_ENDPOINT", ""),
		S3AccessKey: getEnv("S3_ACCESS_KEY", ""),
		S3SecretKey: getEnv("S3_SECRET_KEY", ""),
		S3Bucket:    getEnv("S3_BUCKET", "aquabook"),

		SMTPHost:     getEnv("SMTP_HOST", ""),
		SMTPPort:     getEnv("SMTP_PORT", "587"),
		SMTPUsername: getEnv("SMTP_USERNAME", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		FromEmail:    getEnv("FROM_EMAIL", "noreply@aquafolks.com"),
		FromName:     getEnv("FROM_NAME", "AquaFolks"),

		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3001"),

		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		DiscordClientID:    getEnv("DISCORD_CLIENT_ID", ""),
		DiscordSecret:      getEnv("DISCORD_SECRET", ""),
		FacebookClientID:   getEnv("FACEBOOK_CLIENT_ID", ""),
		FacebookSecret:     getEnv("FACEBOOK_SECRET", ""),

		Environment: getEnv("ENVIRONMENT", "dev"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
