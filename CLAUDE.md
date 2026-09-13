# CLAUDE.md

> **Read [`AGENTS.md`](./AGENTS.md) first** — it contains the complete project context, architecture, coding standards, and testing guidelines for this repository.
>
> **DeepWiki:** <https://deepwiki.com/gundestrup/obsidian-research>

## Claude-specific notes

- This is an Obsidian plugin written in TypeScript. The entry point is `main.ts`.
- Always run `npm run lint` and `npm test` before declaring a task complete.
- Use tab indentation (not spaces) to match the project style.
- `obsidianmd/ui/sentence-case` is configured in `eslint.config.mjs` with `acronyms` (NCBI, DOI, PMC, API, URL, ID) and `ignoreWords` (PubMed, Obsidian) — known proper nouns don't trigger it. Add new proper nouns to the config instead of using eslint-disable comments.
- API functions in `src/api.ts` use dependency injection via `RequestFunction` — never call `requestUrl` directly in those functions.
- Tests import from `src/` modules, not from duplicated test utilities.
- See `AGENTS.md` for full architecture, module graph, and build commands.
