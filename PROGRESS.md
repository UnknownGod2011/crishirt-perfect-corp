# CriShirt WebMCP Progress

## Mission
Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this run: `105c6a132ae007758693dbc7ed6a8cee713af3c3`
- Compare entering this run: 56 commits ahead of `main`, 0 behind; merge base exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Production remains on `main`; this WebMCP branch has not been promoted.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Exact entering deployment for `105c6a132...`: `dpl_7uuH5ksZU6WtyzBq2AmwrGtH73kA`, state `READY`.
- Vercel metadata ties that deployment to repository `UnknownGod2011/crishirt-perfect-corp`, branch `webmcp-agent-native`, and SHA `105c6a132ae007758693dbc7ed6a8cee713af3c3`.
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

All WebMCP entry points feature-detect `document.modelContext`, so unsupported browsers retain the normal human UI flow.

## Shared state, safety, and privacy
- Workspace mutations accept optional `expectedRevision`; stale calls return deterministic `STALE_STATE` rather than silently overwriting later state.
- Collection catalog/cart behavior is shared between humans and agents through `src/config/collectionCatalog.ts`.
- Virtual Try-On humans and agents share the same `generateVirtualTryOn` action.
- Camera permission, file picking, raw person-photo data, generated try-on result bytes/URLs, and downloads remain human-controlled.
- No primary tool is a DOM-click, CSS-selector, coordinate-click, or visual wrapper.
- Provider-backed callbacks use `(inputObject, { signal })` and propagate the execution `AbortSignal` into cancellable provider requests.

## Current official WebMCP specification check
Reverified on 2026-09-07 against the official Web Machine Learning Community Group WebMCP Draft Community Group Report dated 2026-09-04.

Current draft facts relevant to CriShirt:
- `document.modelContext` is the imperative API surface and is exposed in secure contexts.
- `registerTool(tool, options)` is the semantic registration path.
- `ToolExecuteCallback` receives `(inputObject, options)` and its execution options carry an `AbortSignal`.
- `ModelContextExecuteToolOptions.signal` cancels one execution.
- `ModelContextRegisterToolOptions.signal` separately controls registration lifetime.
- `getTools()` and `executeTool()` are the in-page discovery/execution APIs.
- Current tool annotations include `readOnlyHint`, `untrustedContentHint`, and `consequentialHint`.
- No currently exposed CriShirt action warrants `consequentialHint: true`; adding it to reversible workspace/cart/navigation/try-on actions would add confirmation friction without matching the draft's intended risk signal.

No spec-driven source correction is needed this run.

## Fresh full-journey audit — 2026-09-07

### Repository / production isolation
Repository identity, branch identity, production baseline, divergence, exact preview, and deployment source metadata were rechecked before mutation. The branch remains 0 commits behind production and scoped to WebMCP-only work.

### Create / edit
`crishirt_get_workspace_state` still collapses garment state, front/back design presence and placement, busy state, cart count, valid product options, route, and revision into one compact observation. `crishirt_configure_workspace` and `crishirt_set_design_placement` continue to replace multiple visual interactions with semantic shared-state mutations.

No new compound create/edit tool is justified. Combining generation, placement, and cart mutation would save few calls while obscuring partial failure and recovery.

### Generation / refinement
`crishirt_generate_design` and `crishirt_refine_design` still use the shared application state, propagate the execution `AbortSignal` directly to provider fetches, and return deterministic cancellation/provider errors.

The immediate overlap window remains: both check React-backed `isGenerating` / `isRefining` before dispatching the busy transition, so two extremely close executions can theoretically pass the check before React state propagation. A bridge-local lock would stop only agent/agent overlap and would not by itself protect the human/agent path. Shipping that partial lock would therefore overstate shared-state correctness.

No functional change was made because the correct fix should guard the same underlying human and agent action path and needs behavioral execution coverage for duplicate rejection, cancellation cleanup, provider-failure cleanup, and release behavior.

### Cart / revision correctness
`expectedRevision` prevents ordinary stale workspace mutations, but same-tick cart mutations can theoretically validate the same revision before React state propagation advances `revisionRef`. Collection add-to-cart intentionally mirrors repeated human adds, so naive idempotency could incorrectly block legitimate duplicate purchases.

A focused reservation/idempotency mechanism remains preferable to a global state rewrite, but it should only be introduced once retry/repeated-call semantics can be exercised behaviorally.

### Navigation / collection
Coverage still matches existing stable human capabilities: direct navigation, collection inspection and cart add, cart inspection/removal, and shared catalog/cart construction. No DOM wrapper or visual interpretation is required for these legitimate actions.

### Virtual Try-On
Virtual Try-On continues to use a synchronous `loadingRef` guard before awaiting the provider request, so it does not share the same immediate duplicate-execution shape as generation/refinement. The privacy boundary also remains correct: the human supplies the photo; tools expose only readiness, eligible cart IDs, and the post-consent execution action.

A new low-risk ergonomics candidate was identified during this audit: the WebMCP registration effect in `VRTryOn.tsx` currently depends on `tryOnResult`. Completing a try-on changes `tryOnResult`, which causes cleanup of the existing registration controller and re-registration of both try-on tools. That produces unnecessary `toolchange` churn and can unregister the tool immediately after the execution that produced the result. A better shape would keep a `tryOnResultRef`, register the tools once for the component lifetime, and read result readiness from the ref.

This candidate was **not shipped** in this run because the local runtime still cannot resolve `github.com`, so a clean checkout and full `tsc -b && vite build` validation could not be performed before committing functional code. The change is small, but the project rule is to avoid committing unvalidated functional work.

### Schemas, annotations, payloads, recovery
The 13-tool surface remains coherent and high leverage. Inputs are bounded to existing product capabilities, read tools use `readOnlyHint`, untrusted prompt/cart/try-on surfaces use `untrustedContentHint` where appropriate, responses are compact, and failures are deterministic and structured.

No additional tiny wrapper, larger payload, DOM-derived interface, or product capability is justified by this audit.

## Tests and verification performed this run
- Read `PROGRESS.md` before editing.
- Verified canonical repository and working branch.
- Verified production `main` remains `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Verified working branch entered at `105c6a132ae007758693dbc7ed6a8cee713af3c3`.
- Compared branch against production: 56 commits ahead, 0 behind, merge base exactly production.
- Verified exact Vercel preview `dpl_7uuH5ksZU6WtyzBq2AmwrGtH73kA` is `READY` and tied to the correct repo/branch/SHA.
- Verified the entering Vercel build ran `tsc -b && vite build`, transformed 2020 modules, and completed successfully.
- Reverified the official 2026-09-04 WebMCP draft, including `Document.modelContext`, imperative registration, execution/registration cancellation, `getTools()`, `executeTool()`, and current annotation hints.
- Re-inspected the main WebMCP bridge, collection bridge, Virtual Try-On registration/execution path, README WebMCP section, and production diff scope.
- Reconfirmed collection tools share human catalog/cart logic.
- Reconfirmed Virtual Try-On synchronously sets `loadingRef.current = true` before awaiting its provider call.
- Attempted a fresh clean checkout to validate a possible Virtual Try-On registration-churn fix; checkout failed before mutation with `Could not resolve host: github.com`.
- No functional source change was made, so no unvalidated functional commit was created.

## Failures found / fixes applied
- No new functional regression found.
- Existing WebMCP callback/cancellation contract remains aligned with the current draft.
- No missing high-leverage semantic capability was found.
- New candidate: avoid Virtual Try-On tool re-registration after `tryOnResult` changes by using a live result ref and component-lifetime registration. Not shipped because the required build gate could not be run locally.
- Remaining: generation/refinement synchronous overlap candidate; a bridge-only lock would be incomplete for human/agent races.
- Remaining: same-revision/retry cart mutation window.
- Environment limitation: clean local GitHub checkout fails DNS resolution, and actual browser-side `document.modelContext.getTools()` / `executeTool()` execution is not available through the current browser tool surface.

## Remaining opportunities
1. When a build-capable checkout is available, implement and validate the small Virtual Try-On registration-stability improvement: keep `tryOnResult` in a ref and avoid re-registering tools on result changes.
2. Execute real `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable browser/testing surface when available.
3. Reproduce simultaneous generation/refinement and add the smallest guard that protects both agent and existing human execution paths, with tests for duplicate rejection, cleanup, cancellation, provider failure, and release.
4. Reproduce same-revision/retried cart mutation and add focused reservation/idempotency protection without blocking deliberate duplicate adds or rewriting global state.
5. Add lightweight behavioral coverage for stale revisions, unsupported-browser fallback, collection availability, route refresh, shared cart state, provider failures, and Virtual Try-On errors when a safe harness is available.
6. Continue fresh audits of schemas, descriptions, annotations, payload size, round trips, state recovery, registration churn, and human/agent race handling without growing the tool surface unnecessarily.
7. Do not merge to `main` solely because a preview builds successfully.

## README
`README.md` remains concise and accurate. Its WebMCP section describes the semantic tool philosophy, thirteen capabilities, privacy boundary, revision handling, testing approach, and per-execution cancellation semantics. Detailed run history remains here.

## Latest commit SHA
Branch head entering this run: `105c6a132ae007758693dbc7ed6a8cee713af3c3`.

This file is updated before the audit commit is created, so the resulting commit SHA is intentionally recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify repository/branch/production isolation and the exact preview/build for the commit produced by this run. If a build-capable checkout is available, validate the Virtual Try-On registration-stability change before shipping it. Attempt standards-style discovery/execution if a WebMCP-capable browser or test harness becomes available. Otherwise continue source-level auditing and do not alter shared concurrency semantics until fixes can be validated across both agent and existing human execution paths.