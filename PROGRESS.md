# CriShirt WebMCP Progress

## Mission
Keep the existing stable human CriShirt experience unchanged while exposing the same legitimate capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX.

## Canonical repository / deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit / exact merge base: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this run: `aaae7f69b605502d3578e78cb761558297730c74`.
- Comparison at run start: 143 commits ahead of production, 0 behind.
- Entering branch Vercel status: `success`.
- Production and production deployment configuration were not modified.

## Implemented WebMCP surface
Main bridge (`src/components/WebMCPBridge.tsx`):
1. `crishirt_get_workspace_state`
2. `crishirt_configure_workspace`
3. `crishirt_set_design_placement`
4. `crishirt_generate_design`
5. `crishirt_refine_design`
6. `crishirt_add_current_design_to_cart`
7. `crishirt_get_cart`
8. `crishirt_remove_cart_item`
9. `crishirt_navigate`

Collection bridge (`src/components/CollectionWebMCPBridge.tsx`):
10. `crishirt_list_collection`
11. `crishirt_add_collection_item_to_cart`

Virtual Try-On (`src/components/VRTryOn.tsx`):
12. `crishirt_get_tryon_state`
13. `crishirt_run_virtual_tryon`

All bridges feature-detect `document.modelContext`, so ordinary human flows continue normally when WebMCP is unavailable.

## Current safety / ergonomics
- Semantic application actions, not DOM-click/CSS-selector wrappers.
- Reuses the same application/cart/catalog/provider state and logic used by humans.
- Workspace mutations support revision validation for stale-state rejection.
- Perfect Corp generation/refinement/Try-On propagates WebMCP `AbortSignal` into `fetch`.
- Read operations use `readOnlyHint`; provider/user-derived output uses `untrustedContentHint` where appropriate.
- Schemas are bounded to existing product capabilities and responses are compact/structured.
- Try-On photo capture/upload remains human-controlled and tools do not return raw person/result image bytes.

## Fresh full-product audit — 2026-09-10 16:20 IST

### Repository isolation
Verified the canonical repository, default `main`, working `webmcp-agent-native`, entering head `aaae7f69b605502d3578e78cb761558297730c74`, exact production merge base, and 143-ahead/0-behind comparison. The WebMCP-relevant diff remains limited to `PROGRESS.md`, README WebMCP documentation, `src/App.tsx`, the three WebMCP/Try-On bridge components, shared collection catalog, and collection-page integration.

### Official WebMCP specification
Fresh verification against the official WebMCP Draft Community Group Report dated **9 September 2026** confirms `document.modelContext`, `registerTool`, `getTools()`, `executeTool()`, registration/execution `AbortSignal`, and the standard `ToolAnnotations` fields `readOnlyHint`, `untrustedContentHint`, and `consequentialHint`.

The spec defines `consequentialHint` for significant real-world or non-reversible actions such as booking a flight or transferring money. CriShirt's current workspace editing, generation, navigation, collection, cart, and virtual try-on actions are reversible/local product actions rather than high-stakes real-world commitments, so they should not be mechanically marked consequential. The local TypeScript tool shapes still omit `consequentialHint`; adding the optional field remains worthwhile standards alignment, with explicit `false` only where useful for clarity.

### Create / edit / recovery journey
Re-audited workspace read/configure/placement/generate/refine. The existing compound tools still remove visual selector interpretation, side switching, prompt entry, drag/resize estimation, and repeated visual reads while preserving shared application state. Revision validation remains the appropriate lightweight race guard. No additional micro-tool is justified.

### Cart / collection / navigation
Current-design add-to-cart, compact cart inspection/removal, collection listing/add-to-cart, constrained semantic navigation, and shared catalog/cart state remain sufficient for existing stable journeys. No broader idempotency or commerce expansion is justified without a reproduced duplicate-action failure.

### Virtual Try-On
Fresh source inspection reconfirmed both Try-On tools are registered inside a `useEffect` whose dependency is `[tryOnResult]`. Creating or clearing a result aborts and re-registers otherwise identical tool definitions. The narrow preferred fix remains: add `tryOnResultRef`, synchronize it with state, read it inside `crishirt_get_tryon_state`, and register the two tools for component lifetime rather than result lifetime.

### README / mature-state documentation
Re-read README WebMCP documentation. It remains concise and accurate: philosophy, all 13 tools, human-controlled photo boundary, revision/cancellation behavior, representative journeys, testing guidance, and pointer to this durable log are all present. No README expansion is justified this run.

### Human stability / unsupported browser
No Perfect Corp generation, editor/placement, cart, collection, Try-On, navigation, visual design, or deployment configuration changed. Feature detection continues to preserve the human website when `document.modelContext` is unavailable.

## Verification / tests performed this run
- Read this durable handoff before any mutation.
- Verified exact canonical repository, default branch, working branch, branch head, merge base, and 143-ahead/0-behind state through connected GitHub.
- Verified entering head Vercel status is `success`.
- Re-read current `src/components/WebMCPBridge.tsx`, `src/components/VRTryOn.tsx`, and README WebMCP documentation.
- Reconfirmed Try-On registration churn at `useEffect(..., [tryOnResult])`.
- Reverified the official 9 September 2026 WebMCP draft and the exact semantics/defaults of `readOnlyHint`, `untrustedContentHint`, `consequentialHint`, and execution `AbortSignal`.
- Retried a clean canonical clone/build gate. Clone failed before install/build with `Could not resolve host: github.com` in the execution container.
- Because a clean build/test-capable checkout was unavailable, no behavioral source mutation was made and no speculative code was committed.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic journey found.
- Known Try-On registration churn remains.
- Local WebMCP TypeScript annotation shapes still omit optional `consequentialHint`; this is standards-alignment debt, not a current runtime regression.
- Clean local clone/build remains blocked by transient DNS/network resolution to `github.com` in the execution container.
- This durable audit handoff was refreshed; no behavioral source code changed.

## Remaining opportunities
1. In a build-capable checkout, add optional `consequentialHint` to all local WebMCP tool type shapes and classify tools deliberately against the current spec; avoid marking ordinary reversible CriShirt actions consequential.
2. Implement and independently test the narrow Try-On result-ref/component-lifetime registration fix.
3. Run `npm ci`, `npm run build`, and relevant integration tests before committing either behavioral/source change.
4. Inspect actual `document.modelContext.getTools()` output and run representative agent journeys through WebMCP-capable/official testing tooling when available.
5. Exercise cancellation, provider failure, stale revision, route changes/refresh, unsupported-browser fallback, and annotations in a capable browser.
6. Reproduce simultaneous human/agent generation/refinement before adding broader concurrency guards.
7. Reproduce retry/duplicate cart mutations before adding idempotency.
8. Continue auditing schemas, annotations, payload size, state recovery, registration churn, observability, and round-trip count from the full human journey each run.
9. Do not merge to `main` solely because a remote preview build is green.

## Latest commit SHA
Latest verified branch head before this handoff update: `aaae7f69b605502d3578e78cb761558297730c74`.

The commit containing this file is created after its contents are fixed, so its SHA is recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify canonical repo/branch/production isolation and deployment status. If a clean build/test-capable checkout is available, first add the optional `consequentialHint` type support with deliberate non-consequential classification, then implement the narrow Try-On registration-lifecycle fix if both can be independently tested safely. Build/test fully and commit only green behavior. Also attempt real WebMCP discovery/execution when a capable browser/test harness is available. If the build environment remains unavailable, perform another fresh full-journey/spec audit and preserve all human behavior.
