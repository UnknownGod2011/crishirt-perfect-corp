# CriShirt WebMCP Progress

## Mission
Keep the existing stable human CriShirt experience unchanged while exposing the same legitimate capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX.

## Canonical repository / deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit / exact merge base: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this run: `96c23fd2130d3de2aa7be8020342c733574e320b`.
- Comparison at run start: 144 commits ahead of production, 0 behind.
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

## Fresh full-product audit — 2026-09-10 17:19 IST

### Repository isolation
Verified the canonical repository, default `main`, working `webmcp-agent-native`, entering head `96c23fd2130d3de2aa7be8020342c733574e320b`, exact production merge base, and 144-ahead/0-behind comparison. The WebMCP-relevant diff remains limited to the existing WebMCP bridges, Try-On integration, collection integration/catalog, README WebMCP documentation, App integration, and this durable progress log. Production remains untouched.

### Official WebMCP specification
Fresh verification against the official WebMCP Draft Community Group Report dated **9 September 2026** confirms the document-scoped `document.modelContext` API and semantic tool-registration model remain current. The existing implementation direction remains aligned: `registerTool`, structured JSON Schemas, execution/registration `AbortSignal`, compact structured outputs, and tool annotations.

The local TypeScript `WebMCPTool.annotations` shapes in the three bridges still model `readOnlyHint` and `untrustedContentHint` but not optional `consequentialHint`. The current spec defines `consequentialHint` for significant real-world/non-reversible effects; ordinary reversible CriShirt workspace edits, generation, navigation, cart, collection, and virtual try-on actions should not be mechanically classified as consequential. Adding optional type support remains worthwhile standards alignment but is not a runtime regression.

### Create / edit / recovery journey
Fresh source inspection of `WebMCPBridge.tsx` reconfirmed the main semantic surface collapses the high-cost human interactions: workspace inspection, garment/color/material/size/side selection, artwork placement, Perfect Corp generation/refinement, current-design cart insertion, cart inspection/removal, and constrained navigation. Revision validation still provides the appropriate lightweight stale-state guard. No additional micro-tool is justified this run.

### Cart / collection / navigation
Fresh inspection of `CollectionWebMCPBridge.tsx` reconfirmed collection products are exposed as compact stable structured data and existing available products can be added through the same shared cart state as the human page. Main-cart and navigation capabilities remain sufficiently covered by the existing bridge. No new commerce or idempotency behavior is justified without a reproduced duplicate-action problem.

### Virtual Try-On
Fresh source inspection of `VRTryOn.tsx` reconfirmed privacy boundaries, cart-item semantic selection, provider `AbortSignal`, deterministic readiness/failure codes, and feature detection. The known lifecycle inefficiency remains: both Try-On tools are registered inside a `useEffect` whose dependency is `[tryOnResult]`. Creating or clearing a result therefore aborts and re-registers otherwise identical tool definitions. The narrow preferred fix remains to introduce a `tryOnResultRef`, synchronize it with state, read it inside `crishirt_get_tryon_state`, and register tools for component lifetime rather than result lifetime.

### Human stability / unsupported browser
No Perfect Corp generation, refinement/editor placement, cart, collection, Try-On, navigation, visual design, or deployment configuration changed this run. Feature detection continues to preserve the ordinary website when `document.modelContext` is absent.

## Verification / tests performed this run
- Read this durable handoff before any mutation.
- Verified exact canonical repository, default branch, working branch, branch head, production merge base, and 144-ahead/0-behind state through connected GitHub.
- Verified entering head Vercel status is `success`.
- Re-read current `src/components/WebMCPBridge.tsx`, `src/components/CollectionWebMCPBridge.tsx`, and `src/components/VRTryOn.tsx`.
- Reconfirmed the Try-On registration churn at `useEffect(..., [tryOnResult])`.
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
Latest verified branch head before this handoff update: `96c23fd2130d3de2aa7be8020342c733574e320b`.

The commit containing this file is created after its contents are fixed, so its SHA is recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify canonical repo/branch/production isolation and deployment status. If a clean build/test-capable checkout is available, first add optional `consequentialHint` type support with deliberate non-consequential classification, then implement the narrow Try-On registration-lifecycle fix if both can be independently tested safely. Build/test fully and commit only green behavior. Also attempt real WebMCP discovery/execution when a capable browser/test harness is available. If the build environment remains unavailable, perform another fresh full-journey/spec audit and preserve all human behavior.
