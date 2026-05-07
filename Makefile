.PHONY: help

help:
	@echo "Available commands:"
	@echo "  make dev-up   - Build and start containers"
	@echo "  make dev-down - Stop and remove containers"
	@echo "  make up       - Start containers (no build)"
	@echo "  make down     - Stop containers"
	@echo "  make build    - Build containers"
	@echo "  make logs     - View container logs"
	@echo "  make clean    - Clean up containers and volumes"

dev-up:
	docker compose up -d --build

dev-down:
	docker compose down -v

up:
	docker compose up -d

down:
	docker compose down -v

build:
	docker compose build

logs:
	docker compose logs -f

clean:
	docker compose down -v --remove-orphans
	docker system prune -f