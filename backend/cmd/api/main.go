package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"aquabook/internal/config"
	"aquabook/internal/handler"
	"aquabook/internal/repository/postgres"
	"aquabook/internal/service"
	"aquabook/pkg/database"
	"aquabook/pkg/storage"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Connect to database
	db, err := database.NewPostgresConnection(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	log.Println("✓ Connected to database")

	// Initialize S3/MinIO storage
	s3Client, err := storage.NewS3Client(
		cfg.S3Endpoint,
		cfg.S3AccessKey,
		cfg.S3SecretKey,
		cfg.S3Bucket,
		false, // useSSL - set to false for local MinIO
	)
	if err != nil {
		log.Fatal("Failed to initialize storage:", err)
	}
	log.Println("✓ Connected to storage")

	// Initialize repositories
	userRepo := postgres.NewUserRepository(db)
	tankRepo := postgres.NewTankRepository(db)
	fishSpeciesRepo := postgres.NewFishSpeciesRepository(db)
	livestockRepo := postgres.NewLivestockRepository(db)
	photoRepo := postgres.NewTankPhotoRepository(db)
	commentRepo := postgres.NewCommentRepository(db)
	likeRepo := postgres.NewLikeRepository(db)
	projectRepo := postgres.NewProjectRepository(db)
	listingRepo := postgres.NewListingRepository(db)
	messageRepo := postgres.NewMessageRepository(db)
	notificationRepo := postgres.NewNotificationRepository(db)
	adminRepo := postgres.NewAdminRepository(db)
	followRepo := postgres.NewFollowRepository(db)
	passwordResetRepo := postgres.NewPasswordResetRepository(db)

	// Initialize services
	emailService := service.NewEmailService(
		cfg.SMTPHost,
		cfg.SMTPPort,
		cfg.SMTPUsername,
		cfg.SMTPPassword,
		cfg.FromEmail,
		cfg.FromName,
	)
	authService := service.NewAuthService(userRepo, passwordResetRepo, emailService, cfg.JWTSecret, cfg.FrontendURL)
	tankService := service.NewTankService(tankRepo)
	fishSpeciesService := service.NewFishSpeciesService(fishSpeciesRepo)
	livestockService := service.NewLivestockService(livestockRepo, tankRepo)
	photoService := service.NewTankPhotoService(photoRepo, tankRepo, s3Client)
	commentService := service.NewCommentService(commentRepo)
	likeService := service.NewLikeService(likeRepo)
	notificationService := service.NewNotificationService(notificationRepo)
	projectService := service.NewProjectService(projectRepo, notificationService)
	listingService := service.NewListingService(listingRepo, userRepo)
	messageService := service.NewMessageService(messageRepo, userRepo)
	adminService := service.NewAdminService(adminRepo, userRepo)
	followService := service.NewFollowService(followRepo, notificationRepo)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	tankHandler := handler.NewTankHandler(tankService)
	fishSpeciesHandler := handler.NewFishSpeciesHandler(fishSpeciesService)
	livestockHandler := handler.NewLivestockHandler(livestockService)
	photoHandler := handler.NewTankPhotoHandler(photoService)
	commentHandler := handler.NewCommentHandler(commentService)
	likeHandler := handler.NewLikeHandler(likeService)
	projectHandler := handler.NewProjectHandler(projectService, s3Client)
	listingHandler := handler.NewListingHandler(listingService, s3Client)
	messageHandler := handler.NewMessageHandler(messageService)
	websocketHandler := handler.NewWebSocketHandler(messageService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	adminHandler := handler.NewAdminHandler(adminService)
	followHandler := handler.NewFollowHandler(followService)

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "AquaBook API",
		ErrorHandler: customErrorHandler,
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3001,http://localhost:3000",
		AllowCredentials: true,
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"time":   time.Now().Unix(),
		})
	})

	// Register auth routes
	authHandler.RegisterRoutes(app, cfg.JWTSecret)

	// Register tank routes
	tankHandler.RegisterRoutes(app, cfg.JWTSecret)

	// Register fish species routes
	fishSpeciesHandler.RegisterRoutes(app)

	// Register livestock routes
	livestockHandler.RegisterRoutes(app, cfg.JWTSecret)

	// Register photo routes
	photoHandler.RegisterRoutes(app, cfg.JWTSecret)

	// Register comment routes
	commentHandler.RegisterRoutes(app, cfg.JWTSecret)

	// Register like routes
	likeHandler.RegisterRoutes(app, cfg.JWTSecret)

	// Register project routes
	projectHandler.RegisterRoutes(app, cfg.JWTSecret)

	// Register marketplace/listing routes
	listingHandler.RegisterRoutes(app, cfg.JWTSecret)

	// Register message routes (REST API)
	messageHandler.RegisterRoutes(app, cfg.JWTSecret)

	// Register WebSocket routes
	websocketHandler.RegisterRoutes(app, cfg.JWTSecret)

	// Register notification routes
	notificationHandler.RegisterRoutes(app, cfg.JWTSecret)

	// Register admin routes
	adminHandler.RegisterRoutes(app, cfg.JWTSecret, userRepo)

	// Register follow routes
	followHandler.RegisterRoutes(app, cfg.JWTSecret)

	// API routes
	api := app.Group("/api/v1")

	api.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "AquaBook API v1",
			"version": "1.0.0",
		})
	})

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("Shutting down server...")
		_ = app.ShutdownWithTimeout(10 * time.Second)
	}()

	// Start server
	port := cfg.Port
	log.Printf("🚀 Server starting on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	return c.Status(code).JSON(fiber.Map{
		"error": err.Error(),
		"code":  code,
	})
}
