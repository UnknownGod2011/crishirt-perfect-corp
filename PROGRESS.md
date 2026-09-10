# CriShirt WebMCP Progress

## Mission
Keep the existing stable human CriShirt experience unchanged while exposing the same legitimate capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX.

## Canonical repository / deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit / exact merge base: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this run: `f1bbc408ba0e82dc183eca3b0882c3debc726914`.
- Comparison at run start: 145 commits ahead of production, 0 behind.
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

## Fresh full-product audit — 2026-09-10 18:21 IST

### Repository isolation
Verified the canonical repository, default `main`, working `webmcp-agent-native`, entering head `f1bbc408ba0e82dc183eca3b0882c3debc726914`, exact production merge base, and 145-ahead/0-behind comparison. The branch diff remains constrained to the existing WebMCP bridges/integration, collection catalog/integration, README WebMCP documentation, App integration, and this durable log. Production remains untouched.

### Official WebMCP specification
Fresh verification against the official WebMCP Draft Community Group Report dated **9 September 2026** reconfirmed `document.modelContext` as the current document-scoped entry point and the semantic `registerTool` model. The implementation direction remains aligned with structured JSON Schemas, registration/execution `AbortSignal`, compact structured outputs, and annotations.

The local TypeScript `WebMCPTool.annotations` shapes still model `readOnlyHint` and `untrustedContentHint` but not optional `consequentialHint`. The current spec defines `consequentialHint` for significant real-world/non-reversible effects; ordinary reversible CriShirt workspace edits, generation, navigation, cart, collection, and virtual try-on actions should not be mechanically marked consequential. Adding optional type support remains worthwhile standards alignment but is not a runtime regression.

### Human journey versus agent journey
Fresh re-audit found no missing high-leverage semantic journey. The existing 13-tool surface already collapses the main visual/click-heavy flows into semantic operations: workspace/state reading, supported garment/color/material/size/side configuration, artwork placement, Perfect Corp generation/refinement, current-design cart insertion, cart inspection/removal, constrained navigation, collection inspection/cart insertion, and virtual try-on readiness/execution. Adding tiny DOM-shaped tools would increase tool count and agent round trips without improving legitimate capability.

### Virtual Try-On lifecycle
Fresh source inspection reconfirmed privacy boundaries, stable cart-item IDs, provider cancellation, deterministic readiness/failure codes, and feature detection. The known lifecycle inefficiency remains: both Try-On tools are registered inside a `useEffect` whose dependency is `[tryOnResult]`. Result creation/clearing therefore aborts and re-registers otherwise identical tool definitions. The preferred narrow fix remains a `tryOnResultRef` synchronized with state, read by `crishirt_get_tryon_state`, with registration scoped to component lifetime.

### Race handling / duplicate actions / recovery
No reproduced new race, duplicate-cart mutation, route-refresh regression, or provider state overwrite was found from source re-audit. Existing revision validation remains the appropriate lightweight stale-state guard for workspace mutations. Broader locking or idempotency changes would be speculative without a failing reproduction and are intentionally deferred.

### Human stability / unsupported browser
No Perfect Corp generation, refinement/editor placement, cart, collection, Try-On, navigation, visual design, or deployment configuration changed this run. Feature detection continues to preserve the ordinary website when `document.modelContext` is absent.

## Verification / tests performed this run
- Read this durable handoff before any mutation.
- Verified exact canonical repository, default branch, working branch, branch head, production merge base, and 145-ahead/0-behind state through connected GitHub.
- Verified entering head Vercel status is `success`.
- Re-read the WebMCP-relevant Virtual Try-On source and reconfirmed `useEffect(..., [tryOnResult])` registration churn.
- Reverified the official WebMCP Draft Community Group Report dated 9 September 2026.
- Retried a clean canonical clone/build gate using the correct branch. Clone again failed before install/build with `Could not resolve host: github.com` in the execution container.
- Because a clean build/test-capable checkout remained unavailable, no behavioral source mutation was made and no speculative source code was committed.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic journey found.
- Known Try-On registration churn remains.
- Local WebMCP annotation types still omit optional `consequentialHint`; standards-alignment debt only.
- Clean local clone/build remains blocked by transient DNS/network resolution to `github.com` in the execution container.
- This durable audit handoff was refreshed; no behavioral source code changed.

## Remaining opportunities
1. In a build-capable checkout, add optional `consequentialHint` to all local WebMCP tool type shapes and classify tools deliberately against the current spec; do not mark ordinary reversible CriShirt actions consequential by default.
2. Implement and independently test the narrow Try-On result-ref/component-lifetime registration fix.
3. Run `npm ci`, `npm run build`, and relevant integration tests before committing either behavioral/source change.
4. Inspect actual `document.modelContext.getTools()` output and execute representative tool journeys in WebMCP-capable/official testing tooling when available.
5. Exercise cancellation, provider failure, stale revision, route changes/refresh, unsupported-browser fallback, annotations, and registration stability in a capable browser.
6. Reproduce simultaneous human/agent generation/refinement before adding broader concurrency guards.
7. Reproduce retry/duplicate cart mutations before adding idempotency.
8. Continue auditing schemas, annotations, payload size, state recovery, registration churn, observability, and round-trip count from the full human journey every run.
9. Do not merge to `main` solely because a remote preview build is green.

## Latest commit SHA
Latest verified branch head before this handoff update: `f1bbc408ba0e82dc183eca3b0882c3debc726914`.

The commit containing this file is created after its contents are fixed, so its SHA is recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify canonical repo/branch/production isolation and deployment status. If a clean build/test-capable checkout is available, first add optional `consequentialHint` type support with deliberate non-consequential classification, then implement the narrow Try-On registration-lifecycle fix if both can be independently tested safely. Build/test fully and commit only green behavior. Also attempt real WebMCP discovery/execution when a capable browser/test harness is available. If the build environment remains unavailable, perform another fresh full-journey/spec audit and preserve all human behavior.
