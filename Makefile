.PHONY: help install dev build test lint clean deploy deploy-preview release

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
	@echo "  make release          Interactive release creation (tag & version bump)"
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

# Release - Interactive version bump, changelog, and tag
release:
	@echo "🚀 Starting release process..."
	@echo ""

	@# Check if git is clean
	@if ! git diff-index --quiet HEAD --; then \
		echo "❌ ERROR: Working directory has uncommitted changes"; \
		echo "Please commit or stash changes before releasing"; \
		exit 1; \
	fi

	@# Check if on main branch
	@CURRENT_BRANCH=$$(git rev-parse --abbrev-ref HEAD); \
	if [ "$$CURRENT_BRANCH" != "main" ]; then \
		echo "❌ ERROR: Not on main branch (currently on $$CURRENT_BRANCH)"; \
		echo "Please switch to main branch before releasing"; \
		exit 1; \
	fi

	@# Pull latest from remote
	@echo "→ Pulling latest from remote..."
	@git pull origin main

	@# Run tests
	@echo "→ Running tests..."
	@make test-ci
	@if [ $$? -ne 0 ]; then \
		echo "❌ Tests failed. Aborting release."; \
		exit 1; \
	fi
	@make test-configs
	@if [ $$? -ne 0 ]; then \
		echo "❌ Config tests failed. Aborting release."; \
		exit 1; \
	fi

	@# Show current version
	@CURRENT_VERSION=$$(node -p "require('./package.json').version"); \
	echo ""; \
	echo "📋 Current version: $$CURRENT_VERSION"; \
	echo ""; \
	echo "Select version bump:"; \
	echo "  1) Patch ($$CURRENT_VERSION → patch)"; \
	echo "  2) Minor ($$CURRENT_VERSION → minor)"; \
	echo "  3) Major ($$CURRENT_VERSION → major)"; \
	read -p "Enter choice [1-3]: " CHOICE; \
	case $$CHOICE in \
		1) BUMP_TYPE=patch ;; \
		2) BUMP_TYPE=minor ;; \
		3) BUMP_TYPE=major ;; \
		*) echo "❌ Invalid choice"; exit 1 ;; \
	esac; \
	\
	echo ""; \
	echo "→ Bumping $$BUMP_TYPE version..."; \
	npm version $$BUMP_TYPE --no-git-tag-version; \
	\
	NEW_VERSION=$$(node -p "require('./package.json').version"); \
	echo "✓ Version bumped to $$NEW_VERSION"; \
	echo ""; \
	\
	echo "→ Committing version..."; \
	git add package.json package-lock.json; \
	git commit -m "chore: release v$$NEW_VERSION"; \
	echo "✓ Committed"; \
	echo ""; \
	\
	echo "→ Creating git tag..."; \
	git tag -a v$$NEW_VERSION -m "Release v$$NEW_VERSION"; \
	echo "✓ Tag created: v$$NEW_VERSION"; \
	echo ""; \
	\
	echo "→ Pushing to remote..."; \
	git push origin main; \
	git push origin v$$NEW_VERSION; \
	echo "✓ Pushed to remote"; \
	echo ""; \
	echo "🎉 Release v$$NEW_VERSION complete!"; \
	echo ""; \
	echo "Next steps:"; \
	echo "  - GitHub Actions will automatically deploy to production"; \
	echo "  - Check https://github.com/reconnct/universal-net-calc/actions for deployment status"; \
	echo "  - Production URL: https://universal-net-calc.reconnct.workers.dev"
