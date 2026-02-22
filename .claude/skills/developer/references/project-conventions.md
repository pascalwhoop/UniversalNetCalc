# Project Conventions

## Architecture
- **Tax logic belongs in YAML configs** (`configs/<country>/<year>/base.yaml`), not TypeScript
- **`packages/engine/`** — pure TypeScript, zero Next.js/React imports allowed
- **UI** uses shadcn/ui + Tailwind; follow patterns in `src/components/calculator/`
- Read `CLAUDE.md` for full architecture overview

## Testing
```bash
npm run test:run       # unit tests (Vitest)
npm run test:configs   # validates all YAML configs — ALWAYS run after any config change
npm run lint           # ESLint
npx tsc --noEmit       # TypeScript check
make prebuild          # regenerates configs-manifest.json — commit if changed
```

## Config system
- Node references: `@input_name` for inputs, `$node_id` for calculated nodes/parameters
- Node types: `bracket_tax`, `percent_of`, `sum`, `sub`, `mul`, `div`, `min`, `max`, `clamp`, `switch`, `lookup`, `conditional`, `round`, `function`
- Test vectors: `configs/<country>/<year>/tests/*.json` — add at minimum low/median/high income cases
- Use `tolerance` or `tolerance_percent` in test vectors to handle rounding differences

## Commit format
`feat:`, `fix:`, `refactor:`, `test:`, `docs:` + description + `(fixes #N)` in commit body

## PR branch naming
`issue-<N>-<short-description>` — e.g. `issue-42-add-nl-labour-credit`
