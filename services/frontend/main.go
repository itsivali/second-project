package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	app := fiber.New(fiber.Config{DisableStartupMessage: true})
	app.Use(recover.New())
	app.Use(helmet.New())
	app.Use(cors.New())
	app.Use(limiter.New(limiter.Config{Max: 300, Expiration: 15 * time.Minute}))
	app.Get("/health", func(c *fiber.Ctx) error {
		logger.Info("health", "service", "frontend")
		return c.JSON(fiber.Map{"status": "ok", "service": "frontend"})
	})
	app.Get("/api/frontend", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"service": "frontend", "message": "hello from frontend"})
	})

	go func() {
		logger.Info("listening", "service", "frontend", "port", 3000)
		if err := app.Listen(":3000"); err != nil {
			logger.Error("server stopped", "error", err)
		}
	}()

	stop, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()
	<-stop.Done()
	logger.Info("shutting down", "service", "frontend")
	_ = app.ShutdownWithTimeout(10 * time.Second)
}
