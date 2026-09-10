# CriShirt WebMCP Progress

## Mission
Keep the existing stable human CriShirt experience unchanged while exposing the same legitimate capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX.

## Canonical repository / deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`.
- Production branch: `main`.
- Production commit / exact merge base: `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Working branch: `webmcp-agent-native`.
- Branch head entering this run: `60ff448fef09abe0240292b99302172f9af092a6`.
- Comparison at run start: 140 commits ahead of production, 0 behind.
- Entering branch Vercel status: `success` (`Deployment has completed`).
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

## Fresh full-product audit — 2026-09-10 13:23 IST

### Repository isolation
Verified the canonical repository, default `main`, working `webmcp-agent-native`, entering head `60ff448fef09abe0240292b99302172f9af092a6`, exact production merge base, and 140-ahead/0-behind comparison. The WebMCP-relevant diff remains limited to `PROGRESS.md`, README WebMCP documentation, `src/App.tsx`, the three WebMCP/Try-On bridge components, shared collection catalog, and collection-page integration.

### Official WebMCP specification
Fresh verification against the official WebMCP Draft Community Group Report dated **9 September 2026** confirms `document.modelContext`, `registerTool`, `getTools()`, `executeTool()`, registration/execution `AbortSignal`, and the standard `ToolAnnotations` fields `readOnlyHint`, `untrustedContentHint`, and `consequentialHint`.

The three local `WebMCPTool` TypeScript shapes still model only `readOnlyHint` and `untrustedContentHint`. This remains a real standards-alignment opportunity, but no annotation change should ship until each existing mutating tool is classified against the spec and the app can pass a clean build/test gate.

### Create / edit / recovery journey
Re-audited workspace read/configure/placement/generate/refine. Existing compound semantic actions still eliminate unnecessary visual selector interpretation, side switching, drag/resize estimation, prompt entry, and repeated visual reads while preserving shared application state. No additional micro-tool is justified.

### Cart / collection / navigation
Current-design add-to-cart, compact cart inspection/removal, collection listing/add-to-cart, constrained semantic navigation, and workspace/cart state remain sufficient for existing stable journeys. No broader idempotency layer is justified without a reproduced duplicate-action failure.

### Virtual Try-On
Fresh source inspection reconfirmed both Try-On tools are registered inside a `useEffect` whose dependency is `[tryOnResult]`. Creating or clearing a result aborts and re-registers otherwise identical tool definitions. The narrow preferred fix remains: add `tryOnResultRef`, keep it synchronized with state, read it inside `crishirt_get_tryon_state`, and register the two tools for component lifetime rather than result lifetime.

### Human stability / unsupported browser
No Perfect Corp generation, editor/placement, cart, collection, Try-On, navigation, visual design, or deployment configuration changed. Feature detection continues to preserve the human website when `document.modelContext` is unavailable.

## Verification / tests performed this run
- Read this durable handoff before any mutation.
- Verified canonical repository and working branch through connected GitHub.
- Compared `main` to `webmcp-agent-native`: 140 ahead / 0 behind; merge base exactly production commit.
- Checked entering head combined status: Vercel `success`.
- Re-read `src/components/WebMCPBridge.tsx` and `src/components/VRTryOn.tsx`.
- Reconfirmed Try-On registration churn at `useEffect(..., [tryOnResult])`.
- Reverified the official 9 September 2026 WebMCP draft and `consequentialHint` semantics.
- No behavioral source mutation was made because a clean local install/build/test gate is not available in this execution environment.
- No uncompiled/speculative code was committed.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic journey found.
- Known Try-On registration churn remains.
- Standards-alignment gap remains: local bridge TypeScript annotation shapes do not yet model `consequentialHint`.
- Behavioral changes remain gated on a clean build/test-capable checkout.
- This durable audit handoff was refreshed; no behavioral source code changed.

## Remaining opportunities
1. In a build-capable checkout, add `consequentialHint` to all local WebMCP tool type shapes, classify each existing tool accurately, then run `npm ci`, `npm run build`, and relevant integration tests before committing.
2. Implement and independently test the narrow Try-On result-ref/component-lifetime registration fix.
3. Inspect actual `document.modelContext.getTools()` output and run representative agent journeys through WebMCP-capable/official testing tooling when available.
4. Exercise cancellation, provider failure, stale revision, route changes/refresh, unsupported-browser fallback, and consequence annotations in a capable browser.
5. Reproduce simultaneous human/agent generation/refinement before adding broader concurrency guards.
6. Reproduce retry/duplicate cart mutations before adding idempotency.
7. Continue auditing schemas, annotations, payload size, state recovery, registration churn, observability, and round-trip count from the full human journey each run.
8. Do not merge to `main` solely because a remote preview build is green.

## Latest commit SHA
Latest verified branch head before this handoff update: `60ff448fef09abe0240292b99302172f9af092a6`.

The commit containing this file is created after its contents are fixed, so its SHA is recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify canonical repo/branch/production isolation and deployment status. If a clean build/test-capable checkout is available, first align the local WebMCP annotation types and existing tool metadata with the 9 September 2026 spec's `consequentialHint`, then implement the narrow Try-On registration-lifecycle fix if both can be independently tested safely. Build/test fully and commit only green behavior. Also attempt real WebMCP discovery/execution when a capable browser/test harness is available. If the build environment remains blocked, perform another fresh full-journey/spec audit and preserve all human behavior.
