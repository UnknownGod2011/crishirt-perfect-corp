# CriShirt WebMCP Progress

## Mission
Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI/UX work.

## Canonical repository and deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this run: `7933c8d83ec14cb429c313b210f3f6752eedfa17`
- Compare entering this run: 88 commits ahead of `main`, 0 behind; merge base exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Production remains on `main`; this WebMCP branch has not been promoted.
- No production deployment configuration, environment variables, auth, database, commerce, or unrelated UI were changed in this run.

## Current WebMCP tool surface
Main bridge: `src/components/WebMCPBridge.tsx`
1. `crishirt_get_workspace_state`
2. `crishirt_configure_workspace`
3. `crishirt_set_design_placement`
4. `crishirt_generate_design`
5. `crishirt_refine_design`
6. `crishirt_add_current_design_to_cart`
7. `crishirt_get_cart`
8. `crishirt_remove_cart_item`
9. `crishirt_navigate`

Collection bridge: `src/components/CollectionWebMCPBridge.tsx`
10. `crishirt_list_collection`
11. `crishirt_add_collection_item_to_cart`

Virtual Try-On: `src/components/VRTryOn.tsx`
12. `crishirt_get_tryon_state`
13. `crishirt_run_virtual_tryon`

All entry points feature-detect `document.modelContext`, so unsupported browsers retain normal human behavior.

## Shared state, safety, and privacy
- Workspace mutations accept optional `expectedRevision`; stale calls return deterministic `STALE_STATE` instead of silently overwriting later state.
- Humans and agents reuse the same application/cart/catalog/provider logic rather than DOM-click wrappers.
- Provider-backed callbacks propagate WebMCP execution cancellation into cancellable requests.
- Virtual Try-On keeps camera/file permission and raw person/result image data human-controlled.
- Primary tools are semantic and structured; they do not expose selectors, DOM-click wrappers, or arbitrary page interaction.

## Current official WebMCP specification check
Reverified on 2026-09-08 against the official Web Machine Learning Community Group Draft Community Group Report dated 2026-09-04.

Current relevant facts:
- `document.modelContext` remains the imperative API surface.
- `registerTool(tool, options)` remains the semantic registration path.
- `getTools()` and `executeTool()` remain the in-page discovery/execution APIs.
- Tool execution receives a required `AbortSignal`; registration lifetime can separately be tied to an `AbortSignal`.
- Tool annotations currently define `readOnlyHint`, `untrustedContentHint`, and `consequentialHint`.
- `consequentialHint` is intended for significant real-world or non-reversible actions; no existing CriShirt WebMCP operation currently justifies setting it true.
- The draft still documents lifecycle ambiguity around rapid unregister/re-register cycles.

No new spec-driven tool-surface correction is required this run.

## Fresh full-journey audit — 2026-09-08

### Repository / production isolation
Verified the canonical repository, `main`, `webmcp-agent-native`, exact branch heads, divergence, and merge base before considering mutation. Production remains untouched.

### Create / edit / state recovery
`crishirt_get_workspace_state` remains the compact semantic recovery primitive for route, garment configuration, front/back design presence and placement, busy state, cart count, valid product choices, and revision. Configure, placement, navigation, generation, and refinement cover the stable Create journey without selector-level tools.

### Generation / refinement
Generation and refinement continue to use existing provider paths, validate inputs, return deterministic failures, and propagate execution cancellation. A bridge-only mutex remains unjustified because it would not protect the visible human path.

### Artwork placement
One bounded semantic placement call remains substantially cheaper and more reliable than agent-side dragging. No DOM drag wrappers are justified.

### Cart / collection
Current-design cart add, compact cart inspection, removal, collection listing, and collection add-to-cart remain covered using shared app/catalog state. Intentional duplicate adds are valid current behavior, so naive idempotency remains unsafe.

### Navigation / recovery
`crishirt_navigate` remains constrained to existing destinations. No broader navigation surface is justified.

### Virtual Try-On
The privacy boundary remains correct: the human supplies the photo; WebMCP only exposes readiness and execution against already-supplied photo/cart state. Provider cancellation and busy protection remain in place.

`VRTryOn.tsx` still registers both Try-On tools in an effect with dependency `[tryOnResult]`. Successful result changes and result clearing therefore unregister and re-register otherwise identical tools. This directly intersects the current spec's documented rapid re-registration ambiguity. The preferred narrow fix remains component-lifetime registration backed by a synchronously maintained `tryOnResult` ref.

That behavioral change was intentionally not shipped in this run because a mandatory pre-ship full-app build/test surface is not available from the connected GitHub API. The prior clean-checkout environment limitation remains unresolved for behavioral edits. A remote post-commit build would not satisfy the requirement to avoid committing speculative or unvalidated code.

### Schemas, annotations, payloads, round trips, and observability
The 13-tool surface remains coherent and high leverage. Read tools remain read-only, provider/user-derived read content remains marked untrusted where appropriate, schemas reject unknown fields, outputs remain compact/structured, and errors remain deterministic. The newly reverified `consequentialHint` annotation does not apply to current tools. No new compound tool materially lowers journey cost enough to justify a broader mutation surface this run.

### Unsupported browser / human website
The bridges still return early when `document.modelContext` or `registerTool` is unavailable. Nothing in this run changed rendering, Perfect Corp provider paths, human cart behavior, navigation, collection UI, editing/placement, or try-on controls.

### README maturity check
`README.md` remains appropriately scoped for the mature semantic WebMCP surface. No README change is justified by this verified no-op functional run.

## Tests and verification performed this run
- Read `PROGRESS.md` before editing.
- Verified canonical repository identity and default branch.
- Verified `webmcp-agent-native` entered at `7933c8d83ec14cb429c313b210f3f6752eedfa17`.
- Verified `main` remains `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared working branch against production: 88 commits ahead, 0 behind, merge base exactly production.
- Reverified the official 2026-09-04 WebMCP draft and current `document.modelContext` / `registerTool` / `getTools()` / `executeTool()` API shape.
- Reverified current annotation semantics: `readOnlyHint`, `untrustedContentHint`, and `consequentialHint`.
- Re-read `src/components/VRTryOn.tsx` around semantic registration, state refs, cancellation, privacy boundary, busy handling, provider failures, and error paths.
- Confirmed the Virtual Try-On registration effect still ends with dependency `[tryOnResult]`.
- No functional source change was made, so no unvalidated behavior was committed.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic capability found.
- Registration-lifecycle inefficiency remains in Virtual Try-On.
- Remaining candidate: shared generation/refinement same-tick overlap protection covering both human and agent paths.
- Remaining candidate: focused cart retry/same-tick protection that preserves intentional duplicate adds.
- Environment limitation remains: no safe pre-commit build-capable checkout or actual browser-side `document.modelContext.getTools()` / `executeTool()` execution surface is available in this run.
- Durable handoff updated with exact current branch/spec/audit facts and verified no-op reasoning.

## Remaining opportunities
1. When a build-capable checkout is available, implement and locally validate the Virtual Try-On registration-stability change before committing it.
2. Execute actual `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable browser/testing surface when available.
3. Reproduce simultaneous generation/refinement and add only the smallest shared guard covering both human and agent paths, with cancellation/provider-failure cleanup tests.
4. Reproduce same-revision/retried cart mutations and add focused protection without blocking intentional duplicates.
5. Continue behavioral coverage for stale revisions, unsupported-browser fallback, route refresh, collection availability, shared cart state, provider failures, and Virtual Try-On errors when a safe harness is available.
6. Keep auditing schemas, descriptions, annotations, payload size, round trips, state recovery, registration churn, race handling, and observability without growing the tool surface unnecessarily.
7. Do not merge to `main` solely because a remote preview builds successfully.

## Latest commit SHA
Branch head entering this run: `7933c8d83ec14cb429c313b210f3f6752eedfa17`.

This file is updated before the audit commit is created, so the resulting audit commit SHA is intentionally recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify repository/branch/production isolation and exact branch head. Retry for a build-capable checkout. If available, implement the Virtual Try-On registration-stability fix with a synchronous result ref and component-lifetime registration, build and test the full app, and only then commit it. Attempt real standards-style discovery/execution if a WebMCP-capable browser/test harness becomes available. Otherwise continue the fresh source-level audit and do not alter shared concurrency semantics without validation.
