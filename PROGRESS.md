# CriShirt WebMCP Progress

## Mission
Keep the existing stable human CriShirt experience unchanged while exposing the same legitimate capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX.

## Canonical repository / deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this run: `8c2113bba40d4d1242cacb2b459271490e2ef234`.
- Comparison at run start: 137 commits ahead of production, 0 behind; merge base is exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Entering branch Vercel status: `success` / deployment completed.
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
- Tools are semantic application actions, not DOM-click or CSS-selector wrappers.
- Tools reuse the same application/cart/catalog/provider state and logic used by humans.
- Workspace mutations support revision validation to reject stale agent mutations deterministically.
- Perfect Corp-backed generation/refinement/Try-On operations propagate WebMCP `AbortSignal` into `fetch`.
- Read operations use `readOnlyHint` where appropriate; provider/user-derived output uses `untrustedContentHint` where appropriate.
- Schemas are bounded to existing product capabilities and responses are compact/structured.
- Try-On photo capture/upload remains human-controlled and tools do not return raw person/result image bytes.

## Fresh full-product audit — 2026-09-10 10:25 IST

### Repository isolation
Verified the canonical repository, default `main`, working `webmcp-agent-native`, entering head `8c2113bba40d4d1242cacb2b459271490e2ef234`, exact production merge base, and 137-ahead/0-behind comparison. The WebMCP-relevant diff remains limited to `PROGRESS.md`, README WebMCP documentation, `src/App.tsx`, the three WebMCP/Try-On bridge components, shared collection catalog, and collection page integration.

### Create / edit / recovery journey
Re-audited workspace read/configure/placement/generate/refine. The current compound semantic actions still remove unnecessary garment-selector interpretation, side switching, drag/resize estimation, prompt entry, and repeated visual reads while preserving the same underlying application state. No additional micro-tool is justified.

### Cart / collection / navigation
Current-design add-to-cart, compact cart inspection/removal, collection listing/add-to-cart, constrained semantic navigation, and workspace/cart state remain sufficient for the existing stable human journeys. No broader idempotency layer is justified without a reproduced duplicate-action failure.

### Virtual Try-On
Fresh source inspection confirms both Try-On tools are still registered inside a `useEffect` with dependency `[tryOnResult]`. Creating or clearing a result therefore aborts and re-registers otherwise identical tool definitions. This remains the strongest narrow code improvement because stable tool identity reduces discovery/execution races.

Preferred fix remains small: add `tryOnResultRef`, synchronize it with state, read it inside `crishirt_get_tryon_state`, and register the two Try-On tools for component lifetime rather than result lifetime.

The fix was **not shipped this run** because the required clean local compile/test gate is still unavailable. A fresh canonical clone of `webmcp-agent-native` again failed with `Could not resolve host: github.com`. Connected GitHub source access and a green existing Vercel preview do not substitute for compiling/testing a new behavioral mutation before committing it.

### Agent interaction cost / tool count
No new high-leverage semantic capability was found. The current 13-tool surface remains coherent across design state, garment configuration, placement, generation/refinement, cart, collection, navigation/recovery, and privacy-safe Try-On. Expanding it now would increase surface complexity without a demonstrated reduction in agent round trips.

### Human stability / unsupported browser
No Perfect Corp generation, editor/placement, cart, collection, Try-On, navigation, UI design, or deployment configuration changed. Feature detection continues to preserve the human website when `document.modelContext` is unavailable.

## Verification / tests performed this run
- Read this durable handoff before any mutation.
- Verified canonical repository and default branch.
- Verified working branch head and exact production merge base.
- Compared production to branch: 137 ahead / 0 behind.
- Checked entering head combined status: Vercel `success`.
- Re-read `src/components/VRTryOn.tsx` and confirmed the registration lifecycle issue remains exactly as documented.
- Re-audited semantic coverage across create/edit/recovery, cart/collection/navigation, and Virtual Try-On.
- Attempted a fresh clean clone/build environment; clone failed before install/build because local DNS could not resolve `github.com`.
- No functional source mutation was made; therefore no speculative or failing behavioral code was committed.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic journey found.
- Known Try-On registration churn remains.
- Transient build-environment blocker remains: local GitHub DNS resolution failure.
- This durable audit handoff was refreshed; no behavioral source code changed.

## Remaining opportunities
1. When a clean build-capable checkout becomes available, implement the narrow Try-On result-ref/component-lifetime registration fix; run `npm ci`, `npm run build`, and relevant integration checks before committing.
2. Inspect actual `document.modelContext.getTools()` output and run representative agent journeys through official/WebMCP-capable testing tooling when available.
3. Exercise cancellation, provider failure, stale revision, route changes/refresh, and unsupported-browser fallback in a real capable browser.
4. Reproduce simultaneous human/agent generation/refinement before adding any broader concurrency guard.
5. Reproduce retry/duplicate cart mutations before adding idempotency.
6. Continue auditing schemas, annotations, payload size, state recovery, registration churn, observability, and round-trip count from the full human journey each run.
7. Do not merge to `main` solely because a remote preview build is green.

## Latest commit SHA
Latest verified branch head before this handoff update: `8c2113bba40d4d1242cacb2b459271490e2ef234`.

The commit containing this file is necessarily created after the file contents are fixed, so its SHA is recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify canonical repo/branch/production isolation and deployment status. Retry a clean build-capable checkout. If it works, implement only the narrow Virtual Try-On registration-lifecycle fix, build/test it fully, and commit only if green. Also attempt real WebMCP discovery/execution when a capable browser/test harness is available. If the build environment remains blocked, perform another fresh full-journey audit and preserve all human behavior.
