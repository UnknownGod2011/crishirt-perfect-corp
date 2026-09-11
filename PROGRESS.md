# CriShirt WebMCP Progress

## Mission
Keep the existing stable human CriShirt experience unchanged while exposing the same legitimate capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX.

## Canonical repository / deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit / exact merge base: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this run: `0ab61771998409c47ab381459fb3a214d0617ae7`.
- Entering comparison: 165 commits ahead of production, 0 behind.
- Entering Vercel status for `0ab6177...`: success.
- Production `main` and production deployment configuration were not modified.

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

All bridges feature-detect `document.modelContext`, so normal human flows continue when WebMCP is unavailable.

## Current safety / ergonomics
- Semantic application actions, not DOM-click/CSS-selector wrappers.
- Reuses the same React/cart/catalog/provider state and logic used by humans.
- Workspace mutations support optional revision validation for stale-state rejection.
- Perfect Corp generation/refinement/Try-On propagates the WebMCP execution `AbortSignal` into `fetch`.
- Read operations use `readOnlyHint`; provider/user-derived output uses `untrustedContentHint` where appropriate.
- Schemas are bounded to existing product capabilities and responses are compact/structured.
- Try-On photo capture/upload remains human-controlled and tools do not return raw person/result image bytes.
- Try-On tools remain registered stably across result-state changes via behavioral commit `723d33e6457b894cf607af48d5f84c4d5082fee9`.

## Fresh full-product audit — 2026-09-11 13:21 IST

### Repository isolation
Verified the canonical repository and working branch before editing. `main` remains `88daa417caa5305f81e5554977a13a94a793cdeb`; `webmcp-agent-native` entered at `0ab61771998409c47ab381459fb3a214d0617ae7`, 165 commits ahead and 0 behind, with `main` still the exact merge base. Production was not touched.

### Deployment verification
GitHub combined status for the entering head reports Vercel `success`. No production deployment configuration was changed.

### Current official WebMCP specification
Freshly checked the Web Machine Learning Community Group report. The current published draft is dated **10 September 2026** and still defines the canonical imperative surface as `document.modelContext.registerTool(...)`. It continues to define:
- `ToolAnnotations.readOnlyHint`, `untrustedContentHint`, and `consequentialHint`;
- a required execution `AbortSignal` in `ToolExecuteCallbackOptions`;
- a registration-lifetime `signal` in `ModelContextRegisterToolOptions`;
- `exposedTo` / `fromOrigins` for cross-document origin filtering;
- `getTools()` / `executeTool()` for discovery and execution.

CriShirt's current same-origin, page-scoped tool model remains aligned. No spec-driven widening, cross-origin configuration, or annotation change is justified this run.

### Human journey versus agent journey
Re-audited the stable in-scope product path from scratch: workspace read/configuration, apparel/color/material/size/side selection, Perfect Corp generation, refinement, artwork placement, collection listing/add-to-cart, cart read/remove, constrained navigation, and Virtual Try-On readiness/execution after a human supplies a photo. The existing 13 semantic tools still cover the stable legitimate human goals without visual DOM interpretation or selector wrappers.

The surface remains round-trip efficient: generation can include supported garment settings in one call; refinement consumes the current workspace image rather than requiring the agent to shuttle image URLs; workspace state is consolidated; collection/cart are structurally readable; Try-On accepts a stable cart item id; navigation is constrained to existing routes.

### Confirmed remaining race: generation/refinement admission
Re-read `src/components/WebMCPBridge.tsx` and reconfirmed the highest-priority concrete race:
- `crishirt_generate_design` and `crishirt_refine_design` check `stateRef.current.isGenerating || stateRef.current.isRefining`.
- The busy flags are then set using React `dispatch`.
- Two near-simultaneous tool executions can both observe the old state before React commits the first dispatch and can therefore both enter provider work.

The narrow safe fix remains a bridge-local synchronous in-flight ref shared by generation/refinement, set after all validation and immediately before busy-state dispatch/provider work, rejected deterministically as `WORKSPACE_BUSY` for a second admission, and cleared in `finally` on success, cancellation, and provider failure. This does not require architecture changes or human-flow changes.

### Build gate
Retried a clean canonical checkout with:
`git clone --branch webmcp-agent-native --single-branch https://github.com/UnknownGod2011/crishirt-perfect-corp.git`

The execution container again failed before install/build with:
`Could not resolve host: github.com`

This is a transient infrastructure/DNS blocker. Because the requested source change cannot be put through a clean `npm ci` + build/lint gate in this environment, the behavioral concurrency fix was not shipped untested.

### Fresh bridge checks
- Main WebMCP bridge still uses stable effect registration and abort-on-unmount cleanup.
- Collection tools remain semantic and reuse the shared catalog/cart state; no extra collection wrapper is justified.
- Virtual Try-On still uses refs for live cart/photo/loading/result state, keeps registration stable with an empty dependency array, propagates cancellation, and preserves the human-controlled photo privacy boundary.
- Unsupported-browser behavior remains safe because each bridge exits without side effects if `document.modelContext` is unavailable.
- No new product capability was invented or exposed.

### Schema / payload / race / recovery audit
- Schemas remain bounded and reject extra properties.
- Read-only and untrusted-output annotations remain appropriate under the 10 September draft.
- No current action warrants `consequentialHint: true`; the tools mutate reversible in-app design/cart/navigation state rather than committing an external purchase or irreversible action.
- Workspace revision validation remains the right lightweight stale-edit guard.
- No reproduced cart retry/duplicate bug justifies adding idempotency complexity yet.
- The generation/refinement same-tick admission window remains the only concrete source change that currently clears the risk/utility bar.

## Verification / tests performed this run
- Read `PROGRESS.md` before mutation.
- Verified canonical repository, production branch, working branch, current head, exact merge base, and 165-ahead/0-behind isolation.
- Verified Vercel success on entering head `0ab6177...`.
- Re-read the main WebMCP bridge, collection bridge, and Virtual Try-On WebMCP integration.
- Re-audited the complete stable human-versus-agent journey.
- Checked the official WebMCP Draft Community Group Report dated 10 September 2026.
- Reconfirmed annotation and AbortSignal semantics against the current draft.
- Reconfirmed the generation/refinement admission race by code-path inspection.
- Retried a clean checkout/build path; clone failed before dependency installation with `Could not resolve host: github.com`.
- No behavioral source code was changed because the clean build/test gate is unavailable.
- Browser-side `document.modelContext.getTools()` / `executeTool()` verification remains unavailable in this execution environment.

## Failures found / fixes applied
- Existing concrete issue remains: near-simultaneous WebMCP generation/refinement calls can both pass the React busy-state guard before the first dispatch commits.
- No new human-flow or WebMCP regression was found.
- No behavioral fix was shipped because the clean build gate remains blocked by transient DNS.
- This durable handoff was refreshed with the exact repository state, current official-spec date, source audit, blocker, and next-run plan.

## Remaining opportunities
1. **Highest priority:** once a clean checkout can build, add one shared synchronous WebMCP generation/refinement in-flight guard before provider work; clear it in `finally`; verify a second concurrent invocation returns deterministic `WORKSPACE_BUSY`.
2. Run `npm ci`, `npm run build`, and the repository's relevant lint/test commands after that narrow change; commit only if green.
3. In a WebMCP-capable browser or official testing environment, inspect actual `document.modelContext.getTools()` registration and execute representative end-to-end CriShirt journeys.
4. Exercise cancellation, provider failure, stale revision, route changes/refresh, unsupported-browser fallback, annotation metadata, registration stability, and same-origin exposure in that environment.
5. Reproduce cart retry/duplicate behavior before adding idempotency.
6. Continue fresh full-journey audits for agent round trips, schemas, payload size, recovery, races, cancellation, observability, and tool ergonomics.
7. Do not merge to `main` solely because a feature-branch preview is green.

## Latest commit SHA
Latest tested behavioral source commit: `723d33e6457b894cf607af48d5f84c4d5082fee9`.
Entering branch head: `0ab61771998409c47ab381459fb3a214d0617ae7`.

The commit containing this handoff file is created after its contents are fixed, so its own SHA is recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify canonical repo/branch/production isolation and deployment status. Retry a clean checkout/build immediately. If the build gate is available, implement only the narrow synchronous generation/refinement admission guard, build/lint/test it, and commit only if green. Then re-audit the entire stable human journey from scratch and continue searching for safe improvements in agent speed, schemas, payload size, recovery, race handling, cancellation, observability, and browser-level WebMCP execution. If the build gate remains unavailable, do not ship untested behavioral code; record the fresh audit and blocker instead.
