# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts

- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this run: `70c658588887fe764dab150facaacdcd4d32bd82`
- Compare entering this run: 48 commits ahead of `main`, 0 behind; merge base exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Production remains on `main`; this WebMCP branch has not been promoted.
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

Virtual Try-On integration: `src/components/VRTryOn.tsx`

12. `crishirt_get_tryon_state`
13. `crishirt_run_virtual_tryon`

All WebMCP entry points feature-detect `document.modelContext`, so unsupported browsers retain the normal human UI flow.

## Shared state, safety, and privacy

- Workspace mutations accept optional `expectedRevision`; stale calls return deterministic `STALE_STATE` instead of silently overwriting later state.
- Collection catalog/cart behavior is shared between humans and agents through `src/config/collectionCatalog.ts`.
- Virtual Try-On humans and agents share the same `generateVirtualTryOn` action.
- Camera permission, file picking, raw person-photo data, generated try-on result bytes/URLs, and downloads remain human-controlled.
- No primary tool is a DOM-click, CSS-selector, coordinate-click, or visual wrapper.
- Provider-backed WebMCP callbacks use the draft-standard execution callback shape `(inputObject, { signal })`, and pass the execution `AbortSignal` into cancellable provider requests.

## Current official WebMCP specification check

Reverified on 2026-09-06 against the official Web Machine Learning Community Group WebMCP Draft Community Group Report dated 2026-09-04.

The current draft explicitly defines:

- `ToolExecuteCallbackOptions` with required `AbortSignal signal`.
- `ToolExecuteCallback` as `(inputObject, options)`.
- The execution algorithm invokes the registered tool callback with both `inputObject` and the execution options object.
- `ModelContextExecuteToolOptions.signal` cancels a specific execution.
- `ModelContextRegisterToolOptions.signal` separately controls registration lifetime.

This corrects the previous run's mistaken interpretation that the callback was standardized as one-argument only. The startup compatibility shim added in that run is therefore unnecessary and risks substituting a registration-lifecycle signal when a conforming execution signal should be authoritative. This run removes the startup interception and restores the already-correct native callback contract used by the bridges.

## Fresh full-journey audit — 2026-09-06

### Repository / production isolation

Repository identity, permissions, branch identity, production baseline, and divergence were checked before changes. The branch remained 0 commits behind production and scoped to WebMCP work.

### Standards execution compatibility — corrected

`src/components/WebMCPBridge.tsx` already defines `ToolExecutionOptions = { signal: AbortSignal }` and its tool type requires `execute(input, options)`. Generation/refinement callbacks use the execution signal for provider fetches. The prior startup shim in `src/webmcp/executeCompat.ts` wrapped `document.modelContext.registerTool` globally and made the execution options optional; this was based on an incorrect reading of the spec.

Safe correction in this run:

- Restore `src/main.tsx` to the pre-shim startup path.
- Remove `src/webmcp/executeCompat.ts` from the branch.
- Restore README wording that accurately states long-running provider operations propagate the WebMCP execution `AbortSignal`.
- Leave all thirteen semantic tools and all Perfect Corp/UI/cart/navigation logic unchanged.

### Create / edit

`crishirt_get_workspace_state` still collapses garment state, front/back design presence, placement, busy state, cart count, valid options, route, and revision into one observation. Configuration and placement remain semantic rather than DOM-driven.

No new compound create tool is justified: combining generation, placement, and cart mutation would reduce calls only marginally while making partial-failure recovery and state transitions less clear.

### Generation / refinement concurrency

The previously identified near-simultaneous generation/refinement overlap remains. Both tools rely on React-propagated busy flags before starting the provider call, so two extremely close calls can theoretically pass the initial check before state propagation.

The smallest future fix remains a synchronous shared operation guard acquired before provider execution and released in `finally`. Do not ship it without a focused behavior test.

### Revision / cart race

Optimistic `expectedRevision` validation is still non-atomic for extremely close synchronous mutations because `revisionRef` advances when React state propagation is observed. Two very rapid cart mutations can theoretically validate the same revision.

Prefer focused same-revision reservation or duplicate protection over any global-state rewrite, and only ship after reproducing the behavior.

### Cart / collection / navigation / Virtual Try-On

The current semantic coverage still matches stable human capabilities: inspect cart, add current design, add supported collection items, remove items, navigate among stable surfaces, inspect try-on readiness, and run the existing try-on action after a human supplies a photo. No quantity-update, checkout, raw-photo, or download tool is justified because the corresponding safe shared human action is absent or intentionally human-controlled.

Virtual Try-On already uses a synchronous `loadingRef` guard, so it does not share the same immediate duplicate-execution shape as generation/refinement.

### Schemas, payloads, annotations, recovery

The 13-tool surface remains coherent and high leverage. Inputs are bounded to existing capabilities, responses are compact, read tools carry `readOnlyHint`, untrusted text surfaces carry `untrustedContentHint`, and mutations use deterministic structured errors. No new tiny wrapper or payload expansion is justified in this audit.

## Tests and verification performed this run

- Read this `PROGRESS.md` before editing.
- Verified canonical repository and write access.
- Verified production `main` remains `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Verified working branch entered at `70c658588887fe764dab150facaacdcd4d32bd82`.
- Compared branch against production: 48 commits ahead, 0 behind, merge base exactly production.
- Reverified the official 2026-09-04 WebMCP draft, including `ToolExecuteCallbackOptions`, `ToolExecuteCallback`, `ModelContextExecuteToolOptions`, and the imperative execution algorithm.
- Re-inspected `src/components/WebMCPBridge.tsx`, startup wiring, README, and the previous compatibility shim.
- Confirmed the main bridge's local TypeScript contract already requires the draft-standard second execution options argument and required `AbortSignal`.
- Retried a clean local clone; this runtime still fails before checkout with `Could not resolve host: github.com`.
- Because the safe correction restores `src/main.tsx` and README to their previously build-validated pre-shim blobs and removes only the unnecessary shim, no Perfect Corp, shared state, cart, route, or human UI logic changes are introduced.

## Failures found / fixes applied

- Found: previous run misread the current draft and added an unnecessary global registration wrapper.
- Fix in this run: remove that wrapper from startup and restore native standards-conforming callback semantics.
- Fix in this run: correct README and this durable handoff to distinguish execution cancellation from registration-lifecycle cancellation.
- Remaining: generation/refinement synchronous overlap candidate.
- Remaining: same-revision cart mutation window.
- Environment limitation: clean local checkout remains blocked by DNS resolution for `github.com`.
- Environment limitation: actual browser-side `document.modelContext.getTools()` / `executeTool()` execution is still unavailable in this runtime.

## Remaining opportunities

1. Verify this correction's exact preview reaches `READY` and that the full Vercel build succeeds.
2. Execute real `document.modelContext.getTools()` discovery and representative tool calls in a WebMCP-capable browser/testing surface when available.
3. Reproduce simultaneous generation/refinement, then add the smallest synchronous shared operation guard with tests for duplicate rejection, cleanup, cancellation, failure, and release.
4. Reproduce same-revision duplicate cart mutation, then add focused reservation/duplicate protection without rewriting global state.
5. Add lightweight behavioral tests for stale revisions, provider failure, unsupported-browser fallback, collection availability, route refresh, shared cart state, and Virtual Try-On errors when a safe harness is available.
6. Continue auditing schemas, descriptions, annotations, payload size, round trips, state recovery, and human/agent race handling without growing the tool surface unnecessarily.
7. Do not merge to `main` solely because a preview builds successfully.

## README

`README.md` remains concise. The WebMCP section describes the semantic tool philosophy, thirteen capabilities, privacy boundary, revision handling, testing approach, and correct per-execution cancellation semantics. Detailed run history remains here.

## Latest commit SHA

Branch head entering this run: `70c658588887fe764dab150facaacdcd4d32bd82`.

This file is updated before the correction commit is created, so the resulting commit SHA is intentionally recorded by the next run rather than attempting a self-referential hash.

## Next run

Read this file first. Reverify repository/branch/production isolation and verify the exact preview/build for the commit produced by this run. If the preview or full build fails, revert only this run's startup/docs correction. If healthy, attempt real browser-side standards-style discovery/execution, then independently target the generation/refinement overlap with a reproducible test before changing concurrency semantics.