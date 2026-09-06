# CriShirt WebMCP Progress

## Mission
Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this run: `6becea25dd1a983090ec93fc2542b11b196f8ca4`
- Compare entering this run: 59 commits ahead of `main`, 0 behind; merge base exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Production remains on `main`; this WebMCP branch has not been promoted.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Exact entering deployment for `6becea25...`: `dpl_EcaQ7AtgFokiYs4scgrpvkW35VYf`, state `READY`.
- Vercel metadata ties that deployment to repository `UnknownGod2011/crishirt-perfect-corp`, branch `webmcp-agent-native`, and SHA `6becea25dd1a983090ec93fc2542b11b196f8ca4`.
- Entering preview build ran `tsc -b && vite build`, transformed 2020 modules, and completed successfully.
- No production deployment configuration, environment variables, auth, database, commerce, or unrelated UI were changed.

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

All WebMCP entry points feature-detect `document.modelContext`, so unsupported browsers retain normal human UI behavior.

## Shared state, safety, and privacy
- Workspace mutations accept optional `expectedRevision`; stale calls return deterministic `STALE_STATE` rather than silently overwriting later state.
- Collection catalog/cart behavior is shared between humans and agents through `src/config/collectionCatalog.ts`.
- Virtual Try-On humans and agents share the same `generateVirtualTryOn` action.
- Camera permission, file picking, raw person-photo data, generated try-on result bytes/URLs, and downloads remain human-controlled.
- No primary tool is a DOM-click, CSS-selector, coordinate-click, or visual wrapper.
- Provider-backed callbacks use `(inputObject, { signal })` and propagate the execution `AbortSignal` into cancellable provider requests.

## Current official WebMCP specification check
Reverified on 2026-09-07 against the official Web Machine Learning Community Group WebMCP Draft Community Group Report dated 2026-09-04.

Relevant current draft facts:
- `document.modelContext` is the imperative API surface.
- `registerTool(tool, options)` is the semantic registration path.
- `ToolExecuteCallback` receives `(inputObject, options)` and execution options carry an `AbortSignal`.
- Registration lifetime cancellation is separate from per-execution cancellation.
- `getTools()` and `executeTool()` are the in-page discovery/execution APIs.
- Current tool annotations include `readOnlyHint`, `untrustedContentHint`, and `consequentialHint`.
- The draft explicitly documents a race hazard when a tool is unregistered and quickly re-registered; this remains directly relevant to the Virtual Try-On registration effect.

No new spec-driven correction is required.

## Fresh full-journey audit — 2026-09-07

### Repository / production isolation
Verified repository identity, default branch, working branch, exact branch head, production baseline, divergence, merge base, exact Vercel preview metadata, and build logs before mutation. A recursive repository tree read was also used to re-check the repository structure and confirm this run stayed scoped to the canonical project.

### Create / edit
`crishirt_get_workspace_state` still compresses garment settings, front/back design presence and placement, busy state, cart count, valid product options, route, and revision into a single compact observation. `crishirt_configure_workspace` and `crishirt_set_design_placement` remain semantic shared-state operations rather than visual wrappers.

No compound create/edit tool is justified. Combining configuration, generation, placement, and cart mutation would save few calls but would obscure partial failures and recovery.

### Generation / refinement
`crishirt_generate_design` and `crishirt_refine_design` still use the site's application state, validate inputs, propagate WebMCP execution cancellation into provider fetches, and return deterministic provider/cancellation failures.

The immediate overlap window remains: both rely on React-backed `isGenerating` / `isRefining` before dispatching the busy transition. Two extremely close human/agent or agent/agent executions can theoretically pass before React state propagation. A bridge-only mutex would solve only agent/agent overlap and would not satisfy the shared-state requirement. The right fix must guard the underlying shared action path and be behaviorally tested for duplicate rejection, cancellation cleanup, provider-failure cleanup, and lock release.

### Placement and state recovery
Placement is exposed semantically with bounded coordinates, size, and rotation, preserving existing workspace state when omitted values are not changed. Revision validation continues to provide lightweight stale-state protection without an architecture rewrite. Current route is returned by workspace state and direct navigation is available for create, try-on, collection, and cart.

### Cart / collection
Current-design cart add, compact cart inspection, cart removal, collection listing, and collection add-to-cart remain covered using the same application data model as human flows. Collection product IDs are stable and availability is validated before mutation.

The same-revision/same-tick cart mutation window remains theoretically possible because revision advancement follows React state propagation. Timestamp-based item IDs also mirror existing human behavior. Naive idempotency is still unsafe because legitimate repeated adds are an existing user action.

### Virtual Try-On
The privacy boundary remains correct: a human supplies the person photo; WebMCP only exposes readiness, eligible cart item IDs, and execution against an already-supplied photo. Provider cancellation is propagated and `loadingRef` is set synchronously before the awaited request, so duplicate try-on execution is rejected promptly.

The strongest narrow improvement remains registration stability. The registration effect depends on `tryOnResult`; completing a try-on changes that state, aborts the current registration controller, and re-registers both tools. The current WebMCP draft directly warns about fast unregister/re-register races with discovery/execution. A small ref-backed result-readiness value plus component-lifetime registration remains the preferred fix.

That functional fix was not shipped this run because the required pre-commit validation environment is still unavailable. A fresh clean checkout command failed before mutation with `Could not resolve host: github.com`. Committing the ref change first and relying on Vercel afterward would violate the rule against committing unvalidated functional work.

### Schemas, annotations, payload size, round trips
The 13-tool surface remains coherent and high leverage. Read tools are appropriately marked read-only; untrusted prompt/cart/try-on surfaces retain `untrustedContentHint` where appropriate. Responses remain compact and structured, and errors remain deterministic. `consequentialHint` is not justified for these current reversible/non-financial CriShirt actions.

No additional tiny wrapper, DOM-derived interface, or invented product capability is justified.

## Tests and verification performed this run
- Read `PROGRESS.md` before editing.
- Verified canonical repository and working branch.
- Verified production `main` remains `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Verified working branch entered at `6becea25dd1a983090ec93fc2542b11b196f8ca4`.
- Compared branch against production: 59 commits ahead, 0 behind, merge base exactly production.
- Verified exact Vercel preview `dpl_EcaQ7AtgFokiYs4scgrpvkW35VYf` is `READY` and tied to the correct repo/branch/SHA.
- Verified entering Vercel build ran `tsc -b && vite build`, transformed 2020 modules, and completed successfully.
- Reverified the official 2026-09-04 WebMCP draft including `document.modelContext`, `registerTool`, `getTools()`, `executeTool()`, per-execution `AbortSignal`, and the documented rapid unregister/re-register race.
- Re-read the recursive repository tree at branch head.
- Re-inspected `WebMCPBridge.tsx` across workspace state, configuration, placement, generation, refinement, cart, navigation, revision handling, schemas, annotations, cancellation, and registration lifetime.
- Re-inspected `CollectionWebMCPBridge.tsx` for semantic collection/cart behavior and shared state.
- Re-inspected `VRTryOn.tsx` for privacy boundaries, readiness, duplicate protection, cancellation, and registration churn.
- Reconfirmed no WebMCP primary interface is a DOM-click or CSS-selector wrapper.
- Retried a fresh clean clone for local build validation; it failed before mutation with `Could not resolve host: github.com`.
- No functional source change was made, so no unvalidated functional commit was created.

## Failures found / fixes applied
- No new human-flow regression found.
- No missing high-leverage semantic capability found.
- Existing WebMCP callback and cancellation contract remains aligned with the current draft.
- Strongest remaining candidate: remove Virtual Try-On result-driven tool re-registration using a live result ref and component-lifetime registration.
- Remaining candidate: generation/refinement same-tick overlap, but any fix must protect both human and agent execution paths.
- Remaining candidate: same-revision/retried cart mutations without blocking deliberate duplicate adds.
- Environment limitation: local clean GitHub checkout still fails DNS resolution; actual browser-side `document.modelContext.getTools()` / `executeTool()` execution is not available through the current browser surface.

## Remaining opportunities
1. When a build-capable checkout is available, implement and validate the Virtual Try-On registration-stability change before shipping it.
2. Execute actual `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable browser/testing surface when available.
3. Reproduce simultaneous generation/refinement and add the smallest shared guard that covers both human and agent paths, with cleanup/cancellation/provider-failure tests.
4. Reproduce same-revision/retried cart mutations and add focused protection without blocking intentional duplicate purchases.
5. Add lightweight behavioral coverage for stale revisions, unsupported-browser fallback, route refresh, collection availability, shared cart state, provider failures, and Virtual Try-On errors when a safe harness is available.
6. Continue fresh audits of schemas, descriptions, annotations, payload size, round trips, state recovery, registration churn, and race handling without growing the tool surface unnecessarily.
7. Do not merge to `main` solely because a preview builds successfully.

## README
`README.md` remains concise and accurate. Its WebMCP section describes the semantic tool philosophy, thirteen capabilities, privacy boundary, revision handling, testing approach, and per-execution cancellation semantics. Detailed run history remains here.

## Latest commit SHA
Branch head entering this run: `6becea25dd1a983090ec93fc2542b11b196f8ca4`.

This file is updated before the audit commit is created, so the resulting commit SHA is intentionally recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify repository/branch/production isolation and the exact preview/build for the commit produced by this run. Retry a clean checkout. If build-capable access returns, implement and locally validate the Virtual Try-On registration-stability fix before committing it, then confirm its preview. Attempt real standards-style discovery/execution if a WebMCP-capable browser/test harness becomes available. Otherwise continue source-level auditing and do not alter shared concurrency semantics without validation.