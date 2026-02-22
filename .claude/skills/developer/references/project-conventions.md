# Project Conventions

## Architecture
- **Tax logic belongs in YAML configs** (`configs/<country>/<year>/base.yaml`), not TypeScript
- **`packages/engine/`** — pure TypeScript, zero Next.js/React imports allowed
- **UI** uses shadcn/ui + Tailwind; follow patterns in `src/components/calculator/`
- Read `CLAUDE.md` for full architecture overview

## UI Components

**Never hand-roll interactive UI elements.** Before writing any component:

1. Check `src/components/ui/` for an existing shadcn component that fits.
2. If nothing fits, install one: `npx shadcn@latest add <component>`
3. If you have access to the **Context7 MCP tool**, use it to look up current docs for shadcn/ui, Next.js, or any other library in use before implementing — don't rely on memory.

Custom-built toggles, selects, modals, or form controls are not acceptable when a shadcn primitive exists or can be installed.

## E2E Tests

Write Playwright e2e tests in `tests/e2e/` for any UI behaviour you implement. Run them headless — never write ad-hoc scripts to /tmp.

```bash
npm run test:e2e   # runs headless against port 3938 (playwright starts its own server)
```

**Important:** The playwright config starts its own dev server on port **3938** — do not change this to 3000 or any other port that conflicts with the developer's running server.

**Composing Radix primitives:** Do not use `asChild` to merge a `TooltipTrigger` onto another Radix primitive (e.g. `TabsTrigger`). It breaks click handling. Wrap the inner primitive in a plain `<span>` instead:
```tsx
<TooltipTrigger asChild>
  <span><TabsTrigger value="x">Label</TabsTrigger></span>
</TooltipTrigger>
```

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
