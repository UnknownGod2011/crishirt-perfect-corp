# CriShirt WebMCP Progress

## Mission
Keep the existing stable human CriShirt experience unchanged while exposing the same legitimate capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX.

## Canonical repository / deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit / exact merge base: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this run: `fd6d4dbeca56d481aeadba8573babb676b357c87`.
- Comparison at run start: 154 commits ahead of production, 0 behind.
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

All bridges feature-detect `document.modelContext`, so normal human flows continue when WebMCP is unavailable.

## Current safety / ergonomics
- Semantic application actions, not DOM-click/CSS-selector wrappers.
- Reuses the same application/cart/catalog/provider state and logic used by humans.
- Workspace mutations support revision validation for stale-state rejection.
- Perfect Corp generation/refinement/Try-On propagates WebMCP `AbortSignal` into `fetch`.
- Read operations use `readOnlyHint`; provider/user-derived output uses `untrustedContentHint` where appropriate.
- Schemas are bounded to existing product capabilities and responses are compact/structured.
- Try-On photo capture/upload remains human-controlled and tools do not return raw person/result image bytes.

## Fresh full-product audit — 2026-09-11 03:24 IST

### Repository isolation
Verified the canonical repository, production `main`, working `webmcp-agent-native`, entering head `fd6d4dbeca56d481aeadba8573babb676b357c87`, exact production merge base `88daa417caa5305f81e5554977a13a94a793cdeb`, and 154-ahead/0-behind comparison through the connected GitHub repository. Production remains untouched.

### Official WebMCP / agent-accessibility review
Fresh standards review found no reason to change the existing `document.modelContext`/semantic-tool direction. The current implementation remains appropriately focused on application-level goals rather than DOM/CSS wrappers, with cancellation and compact structured state already represented in the tool surface.

### Human journey versus agent journey
Fresh full-journey audit found no newly justified high-leverage semantic tool. The current 13-tool surface already covers the stable product journeys requested for agent access: workspace/state reading, supported garment/color/material/size/side configuration, artwork placement, Perfect Corp generation/refinement, current-design cart insertion, cart inspection/removal, constrained navigation, collection inspection/cart insertion, and virtual try-on readiness/execution. Adding UI-shaped micro-tools would increase agent round trips without exposing a legitimate capability unavailable through the existing human product.

### Virtual Try-On lifecycle
Fresh source inspection reconfirmed that both Try-On tools are registered inside a `useEffect` with dependency `[tryOnResult]`. `crishirt_get_tryon_state` reads `tryOnResult` from that closure, so each result creation/clearing aborts and re-registers otherwise identical tool definitions. The preferred narrow fix remains a synchronized `tryOnResultRef` used by the state tool so registrations can remain stable for component lifetime.

This source fix was not shipped because the required clean local build/test gate is still unavailable.

### Race handling / duplicate actions / recovery
No newly reproduced duplicate-cart mutation, provider overwrite, stale-state issue, or route-refresh regression was found. Existing workspace revision validation remains the appropriate lightweight stale-state guard. Broader locking/idempotency remains deferred until a failing reproduction exists.

### Human stability / unsupported browser
No Perfect Corp generation, refinement/editor placement, cart, collection, Try-On, navigation, visual design, or deployment configuration changed this run. Feature detection continues to preserve ordinary website behavior when `document.modelContext` is unavailable.

## Verification / tests performed this run
- Read this durable handoff before mutation.
- Verified exact canonical repository identity and write permissions.
- Verified production `main`, working `webmcp-agent-native`, entering head `fd6d4dbeca56d481aeadba8573babb676b357c87`, exact production merge base, and 154-ahead/0-behind state through connected GitHub.
- Freshly re-read `src/components/VRTryOn.tsx` and reconfirmed the `[tryOnResult]` registration dependency.
- Re-ran a clean canonical clone of `webmcp-agent-native`; clone failed before install/build with `Could not resolve host: github.com` in the execution container.
- Because the required clean build/test-capable checkout remains unavailable, no behavioral source mutation was made and no speculative source code was committed.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic journey found.
- Known Try-On registration churn remains a concrete WebMCP lifecycle reliability risk.
- Local WebMCP annotation types still omit optional `consequentialHint`; standards-alignment debt only.
- Clean local clone/build remains blocked by transient DNS/network resolution to `github.com` in the execution container.
- This durable audit handoff was refreshed; no behavioral source code changed.

## Remaining opportunities
1. In a build-capable checkout, implement and independently test the narrow Try-On result-ref/component-lifetime registration fix first.
2. Add optional `consequentialHint` to local WebMCP tool type shapes and classify tools deliberately; do not mark ordinary reversible CriShirt actions consequential by default.
3. Run `npm ci`, `npm run build`, and relevant integration tests before committing behavioral/source changes.
4. Inspect actual `document.modelContext.getTools()` output and execute representative tool journeys in WebMCP-capable/official testing tooling when available.
5. Exercise cancellation, provider failure, stale revision, route changes/refresh, unsupported-browser fallback, annotations, and registration stability in a capable browser.
6. Reproduce simultaneous human/agent generation/refinement before adding broader concurrency guards.
7. Reproduce retry/duplicate cart mutations before adding idempotency.
8. Continue auditing schemas, annotations, payload size, state recovery, registration churn, observability, and round-trip count from the full human journey every run.
9. Do not merge to `main` solely because a remote preview build is green.

## Latest commit SHA
Latest verified branch head before this handoff update: `fd6d4dbeca56d481aeadba8573babb676b357c87`.

The commit containing this file is created after its contents are fixed, so its SHA is recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify canonical repo/branch/production isolation and deployment status. If a clean build/test-capable checkout is available, implement the narrow Try-On registration-lifecycle fix first, then add optional `consequentialHint` type support if both can be independently tested safely. Build/test fully and commit only green behavior. Also attempt real WebMCP discovery/execution when a capable browser/test harness is available. If the build environment remains unavailable, perform another fresh full-journey/spec audit and preserve all human behavior.
