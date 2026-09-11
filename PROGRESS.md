# CriShirt WebMCP Progress

## Mission
Keep the existing stable human CriShirt experience unchanged while exposing the same legitimate capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX.

## Canonical repository / deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit / exact merge base: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this run: `e321cc2fd63ef06ba2a759319a463ab4647d1616`.
- Entering comparison: 164 commits ahead of production, 0 behind.
- Entering Vercel status for `e321cc2f...`: success.
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
- Try-On tools remain registered stably across result-state changes via the lifecycle fix in `723d33e6457b894cf607af48d5f84c4d5082fee9`.

## Fresh full-product audit — 2026-09-11 12:19 IST

### Repository isolation
Verified the canonical repository, push permissions, default `main`, working branch `webmcp-agent-native`, entering head `e321cc2fd63ef06ba2a759319a463ab4647d1616`, exact production merge base `88daa417caa5305f81e5554977a13a94a793cdeb`, and 164-ahead/0-behind state. Production remains untouched.

### Deployment verification
GitHub commit status for entering head `e321cc2f...` reports Vercel success. This confirms the previous documentation-only handoff commit deployed cleanly. No production deployment configuration was changed.

### Human journey versus agent journey
Re-audited the stable user journey from scratch: workspace read/configuration, garment/color/material/size/side selection, Perfect Corp generation, refinement, artwork placement, collection listing/add-to-cart, cart read/remove, constrained navigation, and Virtual Try-On readiness/execution after human photo consent. The existing 13-tool surface still covers the stable in-scope human goals without requiring visual DOM interpretation.

The current surface remains round-trip efficient: generation can include garment settings in one call, refinement reuses current workspace image state, workspace state is consolidated, collection is structurally readable, Try-On can target a stable cart item id, and navigation is constrained to existing routes.

### Confirmed remaining race: generation/refinement admission
Re-read the current main bridge and reconfirmed the previously identified deterministic admission window:
- `crishirt_generate_design` and `crishirt_refine_design` guard on `stateRef.current.isGenerating || stateRef.current.isRefining`.
- They then set busy state through React `dispatch` before provider work.
- Two near-simultaneous `executeTool()` calls can both observe the old React state before the first dispatch commits.

The narrow safe fix remains a synchronous bridge-local in-flight ref shared by generation/refinement, set immediately after validation and before dispatch/fetch, with deterministic `WORKSPACE_BUSY` rejection for a second admission and cleanup in `finally`. This would not require any product architecture or human-UI rewrite.

### Build gate
Retried a clean checkout early in this run with:
`git clone --branch webmcp-agent-native --single-branch https://github.com/UnknownGod2011/crishirt-perfect-corp.git`

The execution container again failed before install/build with:
`Could not resolve host: github.com`

Because the required clean checkout cannot currently start, `npm ci`, `npm run build`, and `npm run lint` cannot be run here. Per the mission rules, the admission-guard behavioral source fix was not shipped untested.

### Race handling / recovery / cancellation
- Prior Try-On registration churn remains fixed.
- Workspace revision validation remains a lightweight stale-edit guard.
- Generation/refinement and Try-On cancellation already propagate to provider requests.
- The generation/refinement same-tick admission race remains the highest-priority source improvement once a build-capable checkout is available.
- Add-to-cart remains additive and remove-by-id deterministic; no reproduced retry/duplicate failure currently justifies idempotency keys.
- No broader locking architecture is justified without a reproduced human-agent race beyond this narrow admission window.

### Schema / payload / annotations
- Tool names remain coherent rather than fragmented into DOM-level wrappers.
- Input schemas remain bounded to existing capabilities and reject extra properties.
- Read-only surfaces retain `readOnlyHint`.
- User/provider-derived output remains marked with `untrustedContentHint` where appropriate.
- No new compound tool, output expansion, cross-origin exposure, or schema widening clears the safety/utility bar this run.

### Unsupported browser / refresh / human fallback
Bridge components still feature-detect `document.modelContext` and return without side effects when unavailable. Human React state/navigation remains independent of registration, preserving normal website behavior on unsupported browsers and refreshes.

### README maturity check
The README WebMCP section remains concise and accurate for the current 13-tool surface, privacy boundary, revision/cancellation behavior, testing approach, and durable handoff. No README change was needed.

## Verification / tests performed this run
- Read `PROGRESS.md` before mutation.
- Verified canonical repository identity, default branch, write permissions, production `main`, and working branch.
- Verified entering head `e321cc2f...`, exact production merge base, and 164-ahead/0-behind comparison.
- Verified Vercel success on the entering head.
- Re-read the main WebMCP bridge and re-audited the stable human-versus-agent journey.
- Reconfirmed the generation/refinement admission race by code-path reasoning.
- Retried a clean checkout/build path; clone failed before dependency installation with `Could not resolve host: github.com`.
- No behavioral source code was changed because the build/test gate is unavailable.
- Actual browser-side `document.modelContext.getTools()` / `executeTool()` execution remains unavailable in this environment.

## Failures found / fixes applied
- Existing concrete issue remains: near-simultaneous WebMCP generation/refinement calls can both pass the React busy-state guard before the first dispatch commits.
- No new WebMCP or human-flow regression was found this run.
- Did not ship the narrow synchronous in-flight guard because the clean build gate remains unavailable.
- Updated this durable handoff with exact repository/deployment facts and the repeated transient infrastructure blocker.

## Remaining opportunities
1. **Highest priority:** when a clean checkout can build, add one shared synchronous WebMCP generation/refinement in-flight guard before provider fetches; ensure cancellation and provider failures clear it in `finally`, and verify a second concurrent invocation returns deterministic `WORKSPACE_BUSY`.
2. Run `npm ci`, `npm run build`, and `npm run lint` after that narrow change; ship only if all relevant gates are green.
3. Inspect actual `document.modelContext.getTools()` output and execute representative CriShirt journeys in a WebMCP-capable browser/test environment when available.
4. Exercise cancellation, provider failure, stale revision, route changes/refresh, unsupported-browser fallback, annotations, registration stability, and same-origin exposure in that environment.
5. Reproduce retry/duplicate cart mutations before adding idempotency.
6. Continue re-auditing schemas, payload size, round trips, state recovery, race handling, cancellation, observability, and tool ergonomics each run.
7. Do not merge to `main` solely because a feature-branch preview is green.

## Latest commit SHA
Latest tested behavioral source commit: `723d33e6457b894cf607af48d5f84c4d5082fee9`.
Entering documentation head: `e321cc2fd63ef06ba2a759319a463ab4647d1616`.

The commit containing this handoff file is created after its contents are fixed, so its own SHA is recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify canonical repo/branch/production isolation and deployment status. Retry a clean checkout/build early. If the build gate is available, implement only the narrow synchronous generation/refinement admission guard, build/lint it, and commit only if green. Then re-audit the entire human journey again and continue searching for safe improvements in agent speed, schemas, payload size, state recovery, races, cancellation, observability, and browser-level tool execution. If build remains unavailable, do not ship untested behavioral code; record a fresh audit instead.
