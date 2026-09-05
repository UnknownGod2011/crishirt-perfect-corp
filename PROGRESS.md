# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts

- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production baseline: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head before this handoff update: `8de6a0e84b580c304bd66de01bc2f83099f1fd01`
- Compare result before this update: 16 commits ahead of `main`, 0 behind; merge base is exactly the production baseline.
- Vercel project: `crishirtpc`, linked to `UnknownGod2011/crishirt-perfect-corp`.
- Production remains on `main` and has not been promoted or modified by this WebMCP work.
- Preview for `8de6a0e84b580c304bd66de01bc2f83099f1fd01`: deployment `dpl_Gu3Fj31kKJaRHjBA3Pw361w1zaxr`, state `READY`.
- Historical failed preview `4dcef318ea8913b0efc906e1450044ad2da4d320` is superseded by its fix `6b7fdfe28c4b5a048beda4436a3ae9948aa86c7d` and later READY previews.

## Current WebMCP tools

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

All entry points feature-detect `document.modelContext`; unsupported browsers continue through the existing human UI.

## Shared state, safety, and privacy

- Workspace mutations accept optional `expectedRevision`; stale calls return deterministic `STALE_STATE` instead of silently overwriting newer state.
- Perfect Corp generation/refinement and Virtual Try-On propagate the WebMCP execution `AbortSignal` to fetch.
- Collection products and collection cart-item creation are shared between the human page and WebMCP bridge through `src/config/collectionCatalog.ts`.
- Virtual Try-On human and agent execution share the same `generateVirtualTryOn` action.
- Camera permission, file picking, raw person-photo data, result-image bytes/URLs, and downloads remain human-controlled.
- No primary tool is a DOM-click, CSS-selector, or coordinate wrapper.

## Current specification check

The official WebMCP Community Group draft last verified in this work is dated 2026-08-26 and specifies `document.modelContext.registerTool`, JSON Schema `inputSchema`, `readOnlyHint`, `untrustedContentHint`, `consequentialHint`, registration cancellation, execution cancellation, `getTools()`, and `executeTool()`.

`consequentialHint` is intended for significant real-world or non-reversible actions. Current CriShirt WebMCP mutations only alter reversible in-app workspace/cart state or invoke existing image-generation/try-on operations; there is no implemented payment/checkout action. No current tool is therefore being marked consequential solely for annotation coverage.

Actual interactive `document.modelContext.getTools()` plus representative `executeTool()` validation in a WebMCP-capable browser remains unavailable from this automation environment and is explicitly unclaimed.

## Fresh full-journey audit — 2026-09-05

### Create / edit

Coverage remains strong. One read gives garment, side, design, placement, busy, cart-count, valid-option, and revision state. Compound configure and generate calls remove selector round trips. Semantic placement removes visual dragging. Generation/refinement reuse current provider routes and cancellation.

A generation→placement→cart mega-tool remains rejected: it would hide multiple distinct side effects and make partial-failure recovery worse for only a small round-trip saving.

### Concurrency / duplicate invocation audit

A possible narrow race was identified for near-simultaneous WebMCP generation/refinement invocations: each tool checks React-backed `isGenerating` / `isRefining` before dispatching the busy state, and React state propagation is not synchronous. Two calls arriving in the same short window could theoretically both pass the check before `stateRef` reflects the first dispatch.

A small bridge-local in-memory operation lock would likely harden this without changing human behavior, but no functional change was shipped in this run because the available safe repository-edit path would require replacing the full bridge file and the local clone fallback was unavailable due network/DNS resolution in the execution environment. This is not worth risking a working 456-line bridge for a theoretical race without complete local build validation.

Next functional run should implement this only if the full file can be safely edited and built, using a `useRef`-backed WebMCP operation lock that is acquired before async generation/refinement begins and released in `finally`, while retaining the existing React busy-state check for human-visible state.

### Cart

The human cart currently supports reading items/total and removing items. Those actions are covered. There is no human quantity/update control. The visible Checkout button has no implemented checkout behavior, so no WebMCP checkout/payment tool should be invented.

### Exclusive Collection

Covered through shared catalog logic: read compact products and add an available product by stable ID. No duplicated agent-only catalog.

### Navigation

Covered for Create, Virtual Try-On, Collection, and Cart without link discovery.

### Virtual Try-On

Post-consent agent handoff is covered. Human photo acquisition remains permission-sensitive and intentionally not agentized. The agent can inspect readiness, choose an eligible existing cart item, invoke the same Perfect Corp action, receive deterministic semantic success/failure state, and cancel execution.

### AR/camera surfaces

No safe additional semantic mutation was found. Camera access still requires browser permission and direct human acquisition; automating it would weaken the intentional privacy boundary.

## Tests and verification performed this run

- Verified exact canonical repository identity and push access.
- Verified working branch `webmcp-agent-native` exists and head was `8de6a0e84b580c304bd66de01bc2f83099f1fd01` before this update.
- Compared branch against `main`: ahead 16, behind 0, merge base exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Re-read `PROGRESS.md` before evaluating changes.
- Re-inspected the main WebMCP bridge registration/state flow and specifically audited generation/refinement busy-state behavior.
- Verified the exact pre-run branch-head Vercel preview `dpl_Gu3Fj31kKJaRHjBA3Pw361w1zaxr` is `READY`.
- Re-audited create/edit, cart, collection, navigation, try-on, privacy, unsupported-browser fallback, stale-state, cancellation, duplicate invocation, and provider-failure boundaries.
- Attempted to obtain a complete local working copy for safe patch/build validation; the execution environment could not resolve `github.com`, so no speculative functional edit was made.

No functional code change is justified under the available validation conditions this run. The 13-tool surface remains coherent and production-safe.

## Failures found / fixes applied

No new deployed functional failure was found. One theoretical duplicate async invocation race is now explicitly tracked for a later safe patch. The previously reported failed Virtual Try-On preview remains historical and superseded by READY corrective previews. No production change or rollback was required.

## Remaining opportunities

1. Highest priority: run real `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable browser when such an environment becomes available.
2. Safely harden duplicate generation/refinement invocation with a bridge-local operation lock only when full-file edit plus build validation is available.
3. In runtime validation, explicitly test stale revisions, cancellation, provider failures, unsupported-browser fallback, collection availability, shared cart state, route changes/page refresh, duplicate calls, and all Virtual Try-On deterministic errors.
4. Continue auditing long-running generation/refinement for human-vs-agent state races; do not add a risky architectural revision system unless a concrete overwrite path is reproducible.
5. Keep schemas/descriptions compact and accurate; do not add tools merely to increase count.
6. Do not merge to `main` solely because preview builds pass.
7. Treat every new functional commit as unvalidated until its exact or corrective Vercel preview is confirmed `READY`.

## README

`README.md` documents the 13-tool surface, agent-use philosophy, revision/cancellation behavior, collection flow, Virtual Try-On privacy boundary, shared human/agent actions, and representative testing guidance. Keep detailed run history here rather than expanding README.

## Next run

Read this file first. Reverify repository identity, `main` isolation, branch head, and latest preview status. Attempt genuine WebMCP runtime inspection first if a compatible browser/testing surface becomes available. If safe complete-file editing/build validation is available, implement and test the narrow duplicate-generation/refinement lock; otherwise continue the fresh end-to-end human-versus-agent interaction-cost audit and do not ship speculative code.