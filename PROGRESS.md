# CriShirt WebMCP Progress

## Mission
Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts
- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this run: `22d594f42be8d74cb3e5c625c65f45569b341678`
- Compare entering this run: 53 commits ahead of `main`, 0 behind; merge base exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Production remains on `main`; this WebMCP branch has not been promoted.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Exact entering deployment for `22d594f4...`: `dpl_GRVT3JsSHkTBKzHvYFVescmmMZZD`, state `READY`.
- Vercel metadata ties that deployment to repository `UnknownGod2011/crishirt-perfect-corp`, branch `webmcp-agent-native`, and SHA `22d594f42be8d74cb3e5c625c65f45569b341678`.
- Vercel build logs confirm `tsc -b && vite build` succeeded, 2020 modules transformed, and deployment completed.
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
- Workspace mutations accept optional `expectedRevision`; stale calls return deterministic `STALE_STATE` instead of silently overwriting later state.
- Collection catalog/cart behavior is shared between humans and agents through `src/config/collectionCatalog.ts`.
- Virtual Try-On humans and agents share the same `generateVirtualTryOn` action.
- Camera permission, file picking, raw person-photo data, generated try-on result bytes/URLs, and downloads remain human-controlled.
- No primary tool is a DOM-click, CSS-selector, coordinate-click, or visual wrapper.
- Provider-backed callbacks use the current draft callback shape `(inputObject, { signal })` and pass the execution `AbortSignal` into cancellable provider requests.

## Current official WebMCP specification check
Reverified on 2026-09-06 against the official Web Machine Learning Community Group WebMCP Draft Community Group Report dated 2026-09-04.

Current draft facts relevant to CriShirt:
- `document.modelContext` is the imperative API surface.
- `registerTool(tool, options)` is the semantic registration path.
- `ToolExecuteCallbackOptions` has required `AbortSignal signal`.
- `ToolExecuteCallback` receives `(inputObject, options)`.
- `ModelContextExecuteToolOptions.signal` cancels one execution.
- `ModelContextRegisterToolOptions.signal` separately controls registration lifetime.
- `getTools()` and `executeTool()` are the in-page discovery/execution APIs.
- `ToolAnnotations` contains `readOnlyHint`, `untrustedContentHint`, and `consequentialHint`.
- No currently exposed CriShirt action warrants `consequentialHint: true`: workspace edits, generation/refinement, reversible cart changes, navigation, and try-on remain inside the existing product workflow and are not significant real-world/non-reversible actions.

No spec-driven source correction is needed this run.

## Fresh full-journey audit — 2026-09-06

### Repository / production isolation
Repository identity, branch identity, production baseline, divergence, exact preview, and deployment source metadata were rechecked before mutation. The branch remains 0 commits behind production and scoped to WebMCP-only work.

### Create / edit
`crishirt_get_workspace_state` still collapses garment state, front/back design presence, placement, busy state, cart count, valid options, route, and revision into one compact observation. `crishirt_configure_workspace` and `crishirt_set_design_placement` continue to replace multiple visual interactions with semantic shared-state mutations.

No new compound create/edit tool is justified. Combining generation, placement, and cart mutation would save few calls while obscuring partial failure and recovery.

### Generation / refinement
`crishirt_generate_design` and `crishirt_refine_design` still propagate the execution `AbortSignal` directly to provider fetches and emit deterministic cancellation/provider errors.

The immediate overlap window remains: both check React-backed `isGenerating` / `isRefining` before dispatching the busy transition, so two extremely close invocations can theoretically pass the check before React state propagation. The smallest future fix remains a synchronous shared operation guard acquired before provider execution and released in `finally`.

No code change was made because this alters shared-state semantics and actual browser-side WebMCP execution is still unavailable in this runtime to verify duplicate rejection, cancellation cleanup, provider-failure cleanup, and release behavior.

### Cart / revision correctness
`expectedRevision` prevents ordinary stale overwrites in the workspace bridge, but same-tick cart mutations can theoretically validate the same revision before React state propagation advances `revisionRef`. Collection add-to-cart intentionally mirrors repeated human adds, so naive idempotency could incorrectly block legitimate duplicate purchases.

A focused reservation/idempotency mechanism remains preferable to a global state rewrite, but it should only be introduced once retry/repeated-call semantics can be exercised behaviorally.

### Navigation / collection / Virtual Try-On
Coverage still matches existing stable human capabilities: direct navigation, collection inspection and cart add, cart inspection/removal, try-on state inspection, and execution after a human supplies the person photo. No checkout, quantity-update, raw-photo, camera, file-picker, or download tool is justified because the corresponding safe shared human capability is absent or intentionally human-controlled.

Virtual Try-On continues to use a synchronous loading ref guard and therefore does not share the same immediate duplicate-execution shape as generation/refinement.

### Schemas, annotations, payloads, recovery
The 13-tool surface remains coherent and high leverage. Inputs are bounded to existing product capabilities, read tools use `readOnlyHint`, untrusted output surfaces use `untrustedContentHint` where appropriate, responses are compact, and failures are deterministic and structured.

No additional tiny wrapper, larger payload, DOM-derived interface, or annotation expansion is justified by this audit.

## Tests and verification performed this run
- Read `PROGRESS.md` before editing.
- Verified canonical repository and working branch.
- Verified production `main` remains `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Verified working branch entered at `22d594f42be8d74cb3e5c625c65f45569b341678`.
- Compared branch against production: 53 commits ahead, 0 behind, merge base exactly production.
- Verified exact Vercel preview `dpl_GRVT3JsSHkTBKzHvYFVescmmMZZD` is `READY` and tied to the correct repo/branch/SHA.
- Read Vercel build logs: `tsc -b && vite build` succeeded, 2020 modules transformed, deployment completed.
- Reverified the official 2026-09-04 WebMCP draft, including callback options, execution cancellation, registration cancellation, `getTools()`, `executeTool()`, and current annotation hints.
- Re-inspected the main workspace bridge and collection bridge for semantic tool shape, state/revision handling, schemas, annotations, deterministic errors, cancellation propagation, and shared human/agent state.
- No functional source change was made, so no new product build was required before this documentation-only audit commit; the entering functional tree is independently confirmed READY on Vercel.

## Failures found / fixes applied
- No new functional regression found.
- Existing WebMCP callback/cancellation contract remains aligned with the current draft.
- No annotation misuse or missing high-leverage semantic capability was found.
- Remaining: generation/refinement synchronous overlap candidate.
- Remaining: same-revision/retry cart mutation window.
- Environment limitation: actual browser-side `document.modelContext.getTools()` / `executeTool()` execution remains unavailable in this runtime.

## Remaining opportunities
1. Execute real `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable browser/testing surface when available.
2. Reproduce simultaneous generation/refinement and then add the smallest synchronous shared operation guard with tests for duplicate rejection, cleanup, cancellation, provider failure, and release.
3. Reproduce same-revision/retried cart mutation and then add focused reservation/idempotency protection without blocking deliberate duplicate adds or rewriting global state.
4. Add lightweight behavioral coverage for stale revisions, unsupported-browser fallback, collection availability, route refresh, shared cart state, provider failures, and Virtual Try-On errors when a safe harness is available.
5. Continue fresh audits of schemas, descriptions, annotations, payload size, round trips, state recovery, and human/agent race handling without growing the tool surface unnecessarily.
6. Do not merge to `main` solely because a preview builds successfully.

## README
`README.md` remains concise and accurate. Its WebMCP section describes the semantic tool philosophy, thirteen capabilities, privacy boundary, revision handling, testing approach, and per-execution cancellation semantics. Detailed run history remains here.

## Latest commit SHA
Branch head entering this run: `22d594f42be8d74cb3e5c625c65f45569b341678`.

This file is updated before the audit commit is created, so the resulting commit SHA is intentionally recorded by the next run rather than attempting a self-referential hash.

## Next run
Read this file first. Reverify repository/branch/production isolation and the exact preview/build for the commit produced by this run. Attempt standards-style discovery/execution if a WebMCP-capable browser or test harness becomes available. Otherwise continue source-level auditing and do not alter concurrency semantics until they can be behaviorally reproduced and verified.