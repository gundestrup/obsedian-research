# Windsurf AI Rules

> **Read [`AI_INSTRUCTIONS.md`](./AI_INSTRUCTIONS.md) first** — it contains the complete project context, architecture, coding standards, and testing guidelines for this repository.
>
> **DeepWiki:** <https://deepwiki.com/gundestrup/obsedian-research>

## Windsurf-specific notes

- This is an Obsidian plugin (TypeScript + esbuild). Entry point: `main.ts`.
- Modular architecture: `src/types.ts`, `src/utils.ts`, `src/api.ts`, `src/modals.ts`, `src/settings.ts`.
- Pure functions live in `src/utils.ts`. API calls with dependency injection live in `src/api.ts`.
- Lint with `npm run lint`, test with `npm test`, build with `npm run build`.
- Use tabs for indentation. Strict TypeScript is enabled.
- `eslint-plugin-obsidianmd` enforces Obsidian best practices (sentence-case UI text, no `createEl('h2')`, use `Setting.setHeading()`).
- Tests use Vitest 3 with `vi.fn()` mocks for API calls. No real network calls in tests.
- See `AI_INSTRUCTIONS.md` for full details.
