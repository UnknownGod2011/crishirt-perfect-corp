# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository

Repository: `UnknownGod2011/crishirt-perfect-corp`

Production branch: `main`

Production baseline commit: `88daa417caa5305f81e5554977a13a94a793cdeb`

Working integration branch: `webmcp-agent-native`

Latest functional WebMCP commit: `631a3471e0839c11b97d3ff733690f0bdb1a079e`

Latest documentation/audit commit before this run: `8dd204c6ff64f64ee8290fcb638b957ac0965b8c`

Production deployment configuration has not been changed by this work.

## Existing application facts

The app is React + TypeScript + Vite with a shared `AppContext` that owns front/back design state, placement, garment configuration, cart state, and collection cart items.

Existing Perfect Corp generation/refinement routes remain intact. The human site already supports apparel configuration, front/back artwork, drag/resize/rotation, generation, refinement, try-on navigation, Exclusive Collection, and cart flows.

WebMCP remains a thin semantic layer over those existing capabilities rather than a redesign.

## Current WebMCP surface

The feature branch exposes eleven semantic tools.

Main workspace bridge: `src/components/WebMCPBridge.tsx`

1. `crishirt_get_workspace_state` — compact read of live garment/design/cart state plus revision.
2. `crishirt_configure_workspace` — compound garment/color/material/size/side mutation.
3. `crishirt_set_design_placement` — semantic move/resize/rotate without DOM dragging.
4. `crishirt_generate_design` — cancellable Perfect Corp generation with optional garment configuration in the same call.
5. `crishirt_refine_design` — cancellable refinement using the current workspace image directly.
6. `crishirt_add_current_design_to_cart` — adds the current custom design to the existing cart model.
7. `crishirt_get_cart` — compact structured cart summary.
8. `crishirt_remove_cart_item` — removes a cart item by stable id.
9. `crishirt_navigate` — direct semantic navigation among existing surfaces.

Collection bridge: `src/components/CollectionWebMCPBridge.tsx`

10. `crishirt_list_collection` — read-only structured listing of the existing Exclusive Collection.
11. `crishirt_add_collection_item_to_cart` — adds an available collection product directly to the same cart state used by the human page.

Both bridges feature-detect `document.modelContext`. Unsupported browsers retain the existing human experience with no WebMCP dependency.

## Shared-state correctness

Workspace mutations can accept `expectedRevision`; stale writes return `STALE_STATE` instead of silently overwriting newer human state.

Perfect Corp generation and refinement forward the WebMCP execution `AbortSignal` to their underlying fetch calls.

The Exclusive Collection uses shared definitions from `src/config/collectionCatalog.ts`; the human Collection page and WebMCP bridge use the same product definitions and cart-item construction logic.

## Validation

Repository and branch identity were rechecked before editing.

Vercel project `crishirtpc` is still connected to `UnknownGod2011/crishirt-perfect-corp`.

Production remains on `main` commit `88daa417caa5305f81e5554977a13a94a793cdeb` and has not been promoted or modified by WebMCP work.

The latest `webmcp-agent-native` Vercel preview for commit `8dd204c6ff64f64ee8290fcb638b957ac0965b8c` is `READY`.

The current official WebMCP draft was rechecked on 2026-09-05. The implementation still matches the current imperative API: `document.modelContext.registerTool`, JSON Schema inputs, `readOnlyHint`, `untrustedContentHint`, registration cancellation through `AbortSignal`, and execution cancellation through `AbortSignal`.

Actual interactive `document.modelContext.getTools()` / `executeTool()` validation in a WebMCP-capable browser is still not available from this automation environment. A browser-session attempt was made in this run but the environment could not launch the required interactive browser. This remains explicitly unclaimed.

## Branch isolation audit

A fresh `main...webmcp-agent-native` comparison shows the branch is six commits ahead and zero behind. The merge base is exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.

Changed files remain scoped to WebMCP integration/documentation plus the collection refactor required to share human/agent product logic:

- `PROGRESS.md`
- `README.md`
- `src/App.tsx`
- `src/components/WebMCPBridge.tsx`
- `src/components/CollectionWebMCPBridge.tsx`
- `src/config/collectionCatalog.ts`
- `src/pages/collection.tsx`

One audit note: GitHub reports `src/App.tsx` as a large textual diff because the original production file uses BOM/CRLF while the feature-branch edit was normalized to LF. The semantic App change is only the two WebMCP bridge imports plus mounting the bridges under `AppProvider`; this is not a functional UI rewrite. Do not perform a risky formatting-only rewrite during the deadline window merely to shrink the diff.

## Latest journey re-audit

### Create workspace

Strong coverage. One read can drive garment configuration, generation/refinement, exact placement, cart addition, and safe coordination with concurrent human edits.

A tempting optimization is to make `crishirt_generate_design` also accept placement and auto-add-to-cart. This run deliberately did not add that behavior. Generation, placement, and cart insertion are distinct user intents with different failure/undo semantics; hiding them behind one larger side-effecting call would reduce round trips but make accidental cart changes and partial-success recovery harder. The existing generation tool already folds garment configuration into generation, which captures the highest-value safe compound action.

### Custom-design cart

Strong coverage. Agents can add the live design, inspect structured cart state, and remove a specific item without visually parsing cart cards.

### Exclusive Collection

Strong coverage through shared human/agent catalog logic. No duplicate agent-only product catalog exists.

### Navigation

Direct semantic navigation remains sufficient for Create, Try-On, Collection, and Cart.

### AR Try-On

Camera startup remains intentionally human/browser-controlled because the existing flow requires `getUserMedia` permission. Do not wrap camera permission itself as an opaque autonomous action. A future safe improvement may expose non-camera preparation/readiness state only if it reuses existing logic and measurably saves agent observations.

## No-op decision for this run

No functional code commit was justified after the fresh audit.

Reasons:

1. The current eleven-tool surface already covers the highest-value existing user intents without DOM clicking.
2. The most obvious further compound action, generation plus placement plus cart insertion, would introduce broader hidden side effects and weaker recovery semantics for a small round-trip saving.
3. A proper runtime test remains more valuable than increasing tool count.
4. Adding a new test framework solely for WebMCP at this stage would expand dependencies and destabilization risk; current preview builds are healthy and runtime WebMCP execution is the remaining meaningful proof.
5. Camera/permission automation for try-on would cross a browser/user-interaction boundary and is intentionally not added.

This run therefore preferred a verified no-op over speculative code, as required by the automation mission.

## Remaining opportunities

1. Perform actual `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable interactive browser while observing visible CriShirt state.
2. If a compatible runtime becomes available, test stale revisions, cancellation, unsupported-browser no-op behavior, collection availability validation, and shared cart behavior before promotion.
3. Inspect whether a shared non-camera try-on readiness/preparation read can remove a real agent observation step without automating permission-sensitive capture.
4. Re-audit all eleven tools after runtime testing for ambiguous descriptions, excessive payloads, or deterministic-error gaps.
5. Do not merge to `main` solely because preview builds pass; runtime WebMCP-capable browser validation remains the strongest promotion gate.

## README

`README.md` documents the eleven-tool WebMCP surface, agent-use philosophy, revision/cancellation behavior, collection flow, shared collection catalog design, and representative test prompts. Detailed handoff state remains in this file.

## Next run

Read this file first. Reverify repository/branch and production isolation. Prioritize actual WebMCP runtime verification. If runtime verification is still unavailable, perform another full user-journey audit and only ship code where the reduction in agent interaction cost clearly outweighs added state/side-effect risk. Do not add tools merely to increase tool count.
