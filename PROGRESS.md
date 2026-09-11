# CriShirt WebMCP Progress

## Mission
Keep the existing stable human CriShirt experience unchanged while exposing the same legitimate capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX.

## Canonical repository / deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit / exact merge base: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this run: `7a5b57c965156d99ec955ddc286b251126bc42df`.
- Entering comparison: 167 commits ahead of production, 0 behind; `main` is still the exact merge base.
- Entering Vercel status for `7a5b57c...`: success.
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

## Fresh full-product audit — 2026-09-11 15:22 IST

### Repository isolation
Verified the canonical repository and working branch before editing. `main` remains `88daa417caa5305f81e5554977a13a94a793cdeb`; `webmcp-agent-native` entered at `7a5b57c965156d99ec955ddc286b251126bc42df`, 167 commits ahead and 0 behind, with `main` still the exact merge base. Production was not touched.

### Deployment verification
GitHub combined status for the entering head reports Vercel `success`. No production deployment configuration was changed.

### Current official WebMCP specification
Freshly checked the Web Machine Learning Community Group report. The current published draft is dated **10 September 2026** and defines the canonical imperative surface as `document.modelContext.registerTool(...)`, with `getTools()`, `executeTool()`, registration-lifetime signals, execution `AbortSignal`, annotations, and origin exposure controls. CriShirt's current same-origin page-scoped approach remains aligned; no spec-driven tool widening or annotation change is justified this run.

### Human journey versus agent journey
Re-audited the stable in-scope product path from scratch: workspace read/configuration, apparel/color/material/size/side selection, Perfect Corp generation, refinement, artwork placement, collection listing/add-to-cart, cart read/remove, constrained navigation, and Virtual Try-On readiness/execution after a human supplies a photo.

The existing 13 semantic tools still cover the stable legitimate human goals without DOM interpretation or selector wrappers. Generation can combine garment settings in one call, refinement consumes workspace state directly, workspace/cart/collection state is structurally readable, Try-On uses stable cart item IDs, and navigation is constrained to existing routes.

### Confirmed remaining race: generation/refinement admission
Re-read `src/components/WebMCPBridge.tsx` on the current branch and reconfirmed the highest-priority concrete race:
- `crishirt_generate_design` and `crishirt_refine_design` check `stateRef.current.isGenerating || stateRef.current.isRefining`.
- The busy flags are then set through React `dispatch`.
- Two near-simultaneous tool executions can both observe the old state before React commits the first dispatch and can therefore both enter Perfect Corp provider work.

The narrow safe fix remains one bridge-local synchronous in-flight ref shared by generation/refinement, set only after input/state validation and immediately before busy dispatch/provider work, rejected deterministically as `WORKSPACE_BUSY` for a second admission, and cleared in `finally` on success, cancellation, and provider failure. This requires no architecture or human-flow change.

### Build gate
Retried a clean canonical checkout with:
`git clone --branch webmcp-agent-native --single-branch https://github.com/UnknownGod2011/crishirt-perfect-corp.git`

The execution container again failed before install/build with:
`Could not resolve host: github.com`

This is still a transient infrastructure/DNS blocker. Because the source fix cannot be put through the requested clean dependency/build/lint/test gate, the behavioral concurrency guard was not shipped untested.

### Fresh bridge / recovery checks
- Main WebMCP bridge still feature-detects `document.modelContext`, uses stable effect registration, and aborts registrations on unmount.
- Collection tools remain semantic and reuse shared catalog/cart state; no additional collection wrapper is justified.
- Virtual Try-On registration stability, live refs, cancellation propagation, and privacy boundary remain intact.
- Unsupported-browser behavior remains safe because bridges return without side effects when WebMCP is unavailable.
- Workspace revision validation remains the appropriate lightweight stale-edit guard.
- No reproduced cart retry/duplicate failure justifies idempotency complexity yet.
- README's concise WebMCP section remains appropriate and does not need expansion this run.

## Verification / tests performed this run
- Read `PROGRESS.md` before mutation.
- Verified canonical repository, production branch, working branch, exact branch head, exact merge base, and 167-ahead/0-behind isolation.
- Verified Vercel success on entering head `7a5b57c...`.
- Re-read the current generation/refinement implementation in `src/components/WebMCPBridge.tsx`.
- Re-audited the complete stable human-versus-agent journey against the established 13-tool surface.
- Freshly checked the official WebMCP Draft Community Group Report dated 10 September 2026.
- Reconfirmed the generation/refinement same-tick admission race by code-path inspection.
- Retried a clean checkout/build path; clone failed before dependency installation with `Could not resolve host: github.com`.
- No behavioral source code was changed because the clean build/test gate remains unavailable.
- Browser-side `document.modelContext.getTools()` / `executeTool()` verification remains unavailable in this execution environment.

## Failures found / fixes applied
- Existing concrete issue remains: near-simultaneous WebMCP generation/refinement calls can both pass the React busy-state guard before the first dispatch commits.
- No new human-flow or WebMCP regression was found.
- No behavioral fix was shipped because the clean build gate remains blocked by transient DNS.
- This durable handoff was refreshed with exact repository/deployment state, fresh spec verification, source audit, blocker, and next-run plan.

## Remaining opportunities
1. **Highest priority:** once a clean checkout can build, add one shared synchronous WebMCP generation/refinement in-flight guard before provider work; clear it in `finally`; verify a second concurrent invocation returns deterministic `WORKSPACE_BUSY`.
2. Run clean install, build, lint, and relevant tests after that narrow change; commit only if green.
3. In a WebMCP-capable browser or official testing environment, inspect actual `document.modelContext.getTools()` registration and execute representative end-to-end CriShirt journeys.
4. Exercise cancellation, provider failure, stale revision, route changes/refresh, unsupported-browser fallback, annotation metadata, registration stability, and same-origin exposure.
5. Reproduce cart retry/duplicate behavior before adding idempotency.
6. Continue fresh full-journey audits for agent round trips, schemas, payload size, recovery, races, cancellation, observability, and tool ergonomics.
7. Do not merge to `main` solely because a feature-branch preview is green.

## Latest commit SHA
Latest tested behavioral source commit: `723d33e6457b894cf607af48d5f84c4d5082fee9`.
Entering branch head for this run: `7a5b57c965156d99ec955ddc286b251126bc42df`.

The commit containing this handoff file is created after its contents are fixed, so its own SHA is recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify canonical repo/branch/production isolation and deployment status. Retry a clean checkout/build immediately. If the build gate is available, implement only the narrow synchronous generation/refinement admission guard, build/lint/test it, and commit only if green. Then re-audit the entire stable human journey from scratch and continue searching for safe improvements in agent speed, schemas, payload size, recovery, race handling, cancellation, observability, and browser-level WebMCP execution. If the build gate remains unavailable, do not ship untested behavioral code; record the fresh audit and blocker instead.
