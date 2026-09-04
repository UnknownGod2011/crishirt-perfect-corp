# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository

Repository: `UnknownGod2011/crishirt-perfect-corp`

Production branch: `main`

Production baseline commit: `88daa417caa5305f81e5554977a13a94a793cdeb`

Working integration branch: `webmcp-agent-native`

Latest functional WebMCP commit: `631a3471e0839c11b97d3ff733690f0bdb1a079e`

Production deployment configuration has not been changed by this work.

## Existing application facts

The app is React + TypeScript + Vite with a shared `AppContext` that owns front/back design state, placement, garment configuration, cart state, and collection cart items.

Existing Perfect Corp generation/refinement routes remain intact. The human site already supports apparel configuration, front/back artwork, drag/resize/rotation, generation, refinement, try-on navigation, Exclusive Collection, and cart flows.

WebMCP remains a thin semantic layer over those existing capabilities rather than a redesign.

## Current WebMCP surface

The feature branch now exposes eleven semantic tools.

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

The Exclusive Collection was specifically refactored to avoid agent/human drift. `src/config/collectionCatalog.ts` now contains the existing product definitions and a shared `createCollectionCartItem` helper. The human Collection page and the WebMCP collection bridge both use those same definitions and the same cart-item construction logic.

No duplicate agent-only catalog was created.

## Validation

Repository and branch identity were rechecked before editing.

The Vercel project `crishirtpc` is connected to `UnknownGod2011/crishirt-perfect-corp`.

Production remains on `main` commit `88daa417caa5305f81e5554977a13a94a793cdeb` and was not promoted or modified.

The collection WebMCP commit `631a3471e0839c11b97d3ff733690f0bdb1a079e` triggered a Vercel preview deployment. Vercel cloned the correct repository, branch, and commit, ran `npm install`, then `tsc -b && vite build`, and the deployment reached `READY`.

Current WebMCP documentation was rechecked during this pass. The implementation continues to use `document.modelContext.registerTool`, JSON Schema inputs, `readOnlyHint` where applicable, registration cancellation, and execution cancellation consistently with the current API.

Actual interactive `document.modelContext.getTools()` / `executeTool()` validation inside a WebMCP-capable browser has still not been observed in this automation environment. This remains explicitly unclaimed rather than being marked as passed.

The build also reports pre-existing dependency audit and Browserslist/install-script warnings. These were not introduced by the WebMCP collection change and were deliberately not turned into unrelated dependency-upgrade work.

## Latest journey audit

### Create workspace

Strong coverage. One state read can drive compound garment configuration, Perfect Corp generation/refinement, exact placement, cart addition, and safe coordination with concurrent human edits.

### Custom-design cart

Strong coverage. Agents can add the live design, inspect structured cart state, and remove a specific item without visually parsing cart cards.

### Exclusive Collection

Previously human-only except for navigation. This gap is now closed safely.

An agent can perform:

`crishirt_list_collection`
→ choose an available stable product id
→ `crishirt_add_collection_item_to_cart`
→ `crishirt_get_cart`

This removes collection-card visual inspection and button discovery while preserving exactly the same underlying collection product definitions and cart behavior as the human UI.

### Navigation

Direct semantic navigation remains sufficient for Create, Try-On, Collection, and Cart.

### AR Try-On

Camera startup remains intentionally human/browser-controlled because the existing flow requires `getUserMedia` permission. Do not wrap camera permission itself as an opaque autonomous action. A future safe improvement may expose preparation/state around try-on if it reuses existing logic without automating permission-sensitive capture.

## Remaining opportunities

1. Perform actual `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable interactive browser while observing the visible CriShirt state.
2. Add a focused WebMCP test harness for registration, schemas, unsupported-browser no-op behavior, stale revisions, cancellation, collection availability validation, and shared cart behavior if it can be done without destabilizing the project.
3. Inspect whether a shared non-camera “prepare current design for try-on” action can remove agent navigation/observation steps safely.
4. Re-audit all eleven tools for avoidable round trips, verbose payloads, ambiguous schemas/descriptions, or missing deterministic errors after runtime testing.
5. Do not merge the feature branch to `main` solely because preview builds pass; runtime WebMCP-capable browser validation remains the strongest remaining promotion gate.

## README

`README.md` documents the eleven-tool WebMCP surface, agent-use philosophy, revision/cancellation behavior, collection flow, shared collection catalog design, and representative test prompts. Detailed handoff state remains in this file.

## Next run

Read this file first, verify repository/branch and production isolation, then prioritize real WebMCP runtime verification. If runtime verification is still unavailable, focus only on safe automated test coverage or a clearly measurable reduction in agent interaction cost. Do not add tools merely to increase the tool count.
