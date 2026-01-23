.PHONY: help install dev build test lint clean deploy deploy-preview

# Default target
help:
	@echo "Universal Net Calc - Build & Deploy Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install          Install dependencies"
	@echo "  make dev              Start development server"
	@echo "  make build            Build application for production"
	@echo ""
	@echo "Testing:"
	@echo "  make test             Run tests in watch mode"
	@echo "  make test-ci          Run all tests (CI mode)"
	@echo "  make test-configs     Run config tests only"
	@echo "  make lint             Run ESLint"
	@echo ""
	@echo "Deployment:"
	@echo "  make preview          Run locally with Cloudflare Workers runtime"
	@echo "  make deploy-preview   Deploy to preview environment"
	@echo "  make deploy-prod      Deploy to production"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean            Clean generated files"
	@echo "  make prebuild         Generate configs and manifest"

# Installation
install:
	npm ci

# Development
dev:
	npm run dev

# Pre-build steps (config bundling, manifest generation, CF types)
prebuild:
	@echo "→ Bundling configs..."
	@npm run build:configs
	@echo "→ Generating manifest..."
	@npm run generate:manifest
	@echo "→ Generating Cloudflare types..."
	@npm run cf-typegen
	@echo "✓ Pre-build complete"

# Build for production
build: prebuild
	@echo "→ Building Next.js app..."
	@npm run build
	@echo "✓ Build complete"

# Build for Cloudflare deployment (OpenNext)
build-cloudflare: prebuild
	@echo "→ Building with OpenNext for Cloudflare..."
	@npx @opennextjs/cloudflare build
	@echo "✓ Cloudflare build complete"
	@echo "→ Checking bundle size..."
	@BUNDLE_SIZE_MB=$$(du -sm .open-next/server-functions/default/handler.mjs | cut -f1); \
	echo "   Bundle size: $${BUNDLE_SIZE_MB}MB"; \
	if [ $$BUNDLE_SIZE_MB -gt 3 ]; then \
		echo ""; \
		echo "⚠️  WARNING: Bundle exceeds Cloudflare Workers free tier limit (3 MB)"; \
		echo "   Your bundle: $${BUNDLE_SIZE_MB}MB"; \
		echo "   Free tier: 3 MB"; \
		echo "   Paid tier: 10 MB"; \
		echo ""; \
		echo "Options to reduce bundle size:"; \
		echo "  1. Remove unused dependencies"; \
		echo "  2. Upgrade to Workers Paid plan ($$5/mo for 10 MB)"; \
		echo "  3. Use dynamic imports for large libraries"; \
		echo ""; \
		if [ $$BUNDLE_SIZE_MB -gt 10 ]; then \
			echo "❌ ERROR: Bundle exceeds even paid tier limit (10 MB)!"; \
			exit 1; \
		fi; \
	else \
		echo "✓ Bundle size OK for free tier"; \
	fi

# Testing
test:
	npm run test

test-ci:
	npm run test:run

test-configs:
	npm run test:configs

# Linting
lint:
	npm run lint

# Local Cloudflare preview (runs locally with Workers runtime)
preview: build-cloudflare
	@echo "→ Starting local Cloudflare Workers preview..."
	@npx wrangler dev

# Deployment
deploy-preview: build-cloudflare
	@echo "→ Deploying to preview environment..."
	@npx wrangler deploy --env preview
	@echo "✓ Preview deployed"

deploy-prod: build-cloudflare
	@echo "→ Deploying to production..."
	@npx wrangler deploy
	@echo "✓ Production deployed"

# Clean generated files
clean:
	@echo "→ Cleaning generated files..."
	@rm -rf .next
	@rm -rf .open-next
	@rm -rf .generated
	@rm -f cloudflare-env.d.ts
	@rm -f configs-manifest.json
	@echo "✓ Clean complete"
