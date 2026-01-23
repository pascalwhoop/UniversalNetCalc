# Universal Net Calculator

Calculate accurate after-tax income for multiple countries using config-driven tax rules.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Commands

- `npm run dev` - Development server
- `npm run test` - Run tests
- `npm run test:configs` - Validate tax configs
- `npm run build` - Build for production
- `npm run deploy` - Deploy to Cloudflare

## Contributing

Add new countries, tax years, or variants by creating YAML configs. The easiest way is using Claude:

**With Claude (recommended):**
1. Open this repo in Claude Code
2. Say: "add country [country name]" or "add [year] for [country]"
3. Follow the guided workflow - it handles research, config creation, tests, and validation

**Manual workflow:**
1. Create `configs/<country>/<year>/base.yaml` with tax rules
2. Add test vectors in `tests/` directory
3. Run `npm run test:configs` to validate
4. Submit a PR

Config-only PRs get fast-tracked (~30 seconds) with automated validation.

See `CLAUDE.md` for detailed contribution guide.

## Architecture

- **Config-driven**: Tax rules defined in YAML files (`configs/`)
- **Pure engine**: TypeScript calculation engine with no framework dependencies
- **Next.js UI**: React frontend deployed to Cloudflare Workers

See `docs/` for detailed documentation.
