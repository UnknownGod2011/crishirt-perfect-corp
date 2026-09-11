# CriShirt WebMCP Progress

## Mission
Keep the existing stable human CriShirt experience unchanged while exposing the same legitimate capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX.

## Canonical repository / deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit / exact merge base: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this run: `761d0a469976523ca41c7e0e209e0e2504dcd689`.
- Entering comparison: 157 commits ahead of production, 0 behind.
- Entering branch-head Vercel status: success.
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
- Reuses the same application/cart/catalog/provider state and logic used by humans.
- Workspace mutations support revision validation for stale-state rejection.
- Perfect Corp generation/refinement/Try-On propagates WebMCP `AbortSignal` into `fetch`.
- Read operations use `readOnlyHint`; provider/user-derived output uses `untrustedContentHint` where appropriate.
- Schemas are bounded to existing product capabilities and responses are compact/structured.
- Try-On photo capture/upload remains human-controlled and tools do not return raw person/result image bytes.

## Fresh full-product audit — 2026-09-11 06:23 IST

### Repository isolation
Verified the canonical repository, `main`, working branch `webmcp-agent-native`, entering head `761d0a469976523ca41c7e0e209e0e2504dcd689`, exact production merge base `88daa417caa5305f81e5554977a13a94a793cdeb`, and 157-ahead/0-behind state through the connected GitHub repository. The entering branch-head Vercel status was green. Production remains untouched.

### Official WebMCP review
Fresh verification against the official WebMCP Community Group report dated 9 September 2026 reconfirmed `document.modelContext`, imperative `registerTool(...)`, `getTools()`, `executeTool()`, abortable registration/execution, and tool annotations. The report explicitly warns that aborting and quickly re-registering a tool can race with discovery/execution so an invocation may target either the old or new definition.

### Human journey versus agent journey
Fresh full-journey audit found no missing high-leverage semantic capability. The 13-tool surface covers the stable product journeys requested for agent access: state reading, supported garment/color/material/size/side configuration, artwork placement, Perfect Corp generation/refinement, current-design cart insertion, cart inspection/removal, constrained navigation, collection inspection/cart insertion, and privacy-safe Virtual Try-On readiness/execution. Adding UI-shaped micro-tools would increase round trips without exposing a legitimate existing product capability.

### Virtual Try-On registration lifecycle fix
The prior implementation registered both Try-On tools inside `useEffect(..., [tryOnResult])`. Because `crishirt_get_tryon_state` closed over `tryOnResult`, every result creation/clear aborted and re-registered otherwise identical tools, creating exactly the rapid re-registration race warned about by the current WebMCP draft.

Fix implemented in `src/components/VRTryOn.tsx`:
- Added a typed `tryOnResultRef` synchronized from React state.
- `crishirt_get_tryon_state` now reads `tryOnResultRef.current` for `resultReady`.
- Try-On tools now register once for the component lifetime via `useEffect(..., [])` and still abort on unmount/route teardown.
- No human UI, Perfect Corp request payload/path, cart behavior, selection behavior, photo permission behavior, result rendering, or deployment configuration changed.

Source commit: `723d33e6457b894cf607af48d5f84c4d5082fee9` (`fix: keep WebMCP try-on tools registered stably`).

### Schemas / annotations / round trips
The semantic surfaces remain coherent and compact. Local `WebMCPTool` type shapes still omit optional `consequentialHint`; this remains standards-alignment debt rather than a reason for a broad change in this run. No payload or compound-action change had enough evidence to justify behavioral risk.

### Race handling / duplicate actions / recovery
The concrete Try-On registration race was removed. No newly reproduced duplicate-cart mutation, provider overwrite, stale-workspace issue, route-refresh regression, or missing recovery surface was found. Existing workspace revision validation remains the appropriate lightweight stale-state guard. Broader locking/idempotency remains deferred until a failing reproduction exists.

### Human stability / unsupported browser
No visual redesign or human-flow behavior changed. Perfect Corp generation, refinement/editor placement, cart, collection, Try-On UI, navigation, and unsupported-browser fallback remain unchanged. Feature detection still preserves ordinary website behavior when `document.modelContext` is unavailable.

### README maturity check
`README.md` was re-read and its concise WebMCP section remains accurate: philosophy, all 13 tool capabilities, realistic agent journeys, cancellation/revision safeguards, privacy boundaries, and testing guidance are already documented. No README edit was needed this run.

## Verification / tests performed this run
- Read this durable handoff before mutation.
- Verified exact canonical repository identity and write permissions.
- Verified `main`, `webmcp-agent-native`, entering head, exact merge base, and 157-ahead/0-behind state through connected GitHub.
- Verified entering branch-head Vercel status was `success`.
- Freshly re-read `src/components/VRTryOn.tsx` and reproduced the registration-lifecycle cause from source.
- Freshly verified the official 9 September 2026 WebMCP report and its explicit rapid unregister/re-register race warning.
- Local `git clone` remained blocked by transient DNS (`Could not resolve host: github.com`), so the canonical branch was read/written through the authenticated GitHub connector instead.
- Ran a strict TypeScript lifecycle-pattern check with the container's TypeScript 5.8.3; passed after explicitly typing the result ref as `string | null`.
- Ran a focused registration-stability harness confirming result-state updates do not require a second registration.
- Inspected the committed GitHub diff and verified the source commit contains only the intended Try-On lifecycle changes.
- Verified the source commit's full Vercel branch build completed with `success`.
- Recompared source commit `723d33e6457b894cf607af48d5f84c4d5082fee9` against production: 158 commits ahead, 0 behind, with production still the exact merge base.
- Re-read the mature README WebMCP section; no change required.

## Failures found / fixes applied
- Fixed the concrete Try-On WebMCP tool registration churn/race.
- No new human-flow regression found.
- No missing high-leverage semantic journey found.
- Local WebMCP annotation types still omit optional `consequentialHint`; standards-alignment debt only.
- Direct container DNS to GitHub/npm remains unavailable in this run, preventing `git clone` / `npm ci` locally; the full Vercel branch build nevertheless passed on the exact source commit.
- Actual in-browser `document.modelContext.getTools()` / `executeTool()` execution was not available in the current execution environment.

## Remaining opportunities
1. Add optional `consequentialHint` to local WebMCP tool type shapes and classify tools deliberately against the current spec; avoid marking ordinary reversible CriShirt actions consequential by default.
2. Inspect actual `document.modelContext.getTools()` output and execute representative tool journeys in a WebMCP-capable browser or official testing tooling when available.
3. Exercise cancellation, provider failure, stale revision, route changes/refresh, unsupported-browser fallback, annotations, and registration stability in a capable browser.
4. Reproduce simultaneous human/agent generation/refinement before adding broader concurrency guards.
5. Reproduce retry/duplicate cart mutations before adding idempotency.
6. Continue auditing schemas, annotations, payload size, state recovery, registration lifecycle, observability, and round-trip count from the full human journey every run.
7. Do not merge to `main` solely because a feature-branch preview build is green.

## Latest commit SHA
Latest tested behavioral source commit: `723d33e6457b894cf607af48d5f84c4d5082fee9`.

The commit containing this handoff file is created after its contents are fixed, so that documentation commit SHA is recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify canonical repo/branch/production isolation and deployment status. Re-audit the entire existing human journey before proposing changes. First inspect whether `consequentialHint` support can be added narrowly and tested without changing product behavior; otherwise prioritize real `getTools()` / `executeTool()` discovery and representative journey execution in a capable WebMCP browser/test harness. Continue looking for concrete, reproducible improvements in schemas, round trips, cancellation, race handling, state recovery, and observability. If no safe code change is justified, record a fresh no-op audit rather than inventing functionality.
