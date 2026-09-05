# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts

- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production baseline: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head before this handoff update: `0ff4a69e1a880f83817b2ce9c9fbea2c92f5d0ab`
- Compare result before this update: 15 commits ahead of `main`, 0 behind; merge base is exactly the production baseline.
- Vercel project: `crishirtpc`, linked to `UnknownGod2011/crishirt-perfect-corp`.
- Production remains on `main` and has not been promoted or modified by this WebMCP work.
- Preview for `0ff4a69e1a880f83817b2ce9c9fbea2c92f5d0ab`: deployment `dpl_4zmPfwQbGnbstf1hqfdgxxKhrVRt`, state `READY`.
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

Rechecked the official WebMCP Community Group draft on 2026-09-05. The published draft is dated 2026-08-26 and still specifies `document.modelContext.registerTool`, JSON Schema `inputSchema`, `readOnlyHint`, `untrustedContentHint`, `consequentialHint`, registration cancellation, execution cancellation, `getTools()`, and `executeTool()`.

`consequentialHint` is intended for significant real-world or non-reversible actions. Current CriShirt WebMCP mutations only alter reversible in-app workspace/cart state or invoke existing image-generation/try-on operations; there is no implemented payment/checkout action. No current tool is therefore being marked consequential solely for annotation coverage.

Actual interactive `document.modelContext.getTools()` plus representative `executeTool()` validation in a WebMCP-capable browser remains unavailable from this automation environment and is explicitly unclaimed.

## Fresh full-journey audit — 2026-09-05

### Create / edit

Coverage remains strong. One read gives garment, side, design, placement, busy, cart-count, valid-option, and revision state. Compound configure and generate calls remove selector round trips. Semantic placement removes visual dragging. Generation/refinement reuse current provider routes and cancellation.

A generation→placement→cart mega-tool remains rejected: it would hide multiple distinct side effects and make partial-failure recovery worse for only a small round-trip saving.

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
- Verified working branch `webmcp-agent-native` exists and head was `0ff4a69e1a880f83817b2ce9c9fbea2c92f5d0ab` before this update.
- Compared branch against `main`: ahead 15, behind 0, merge base exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Re-read `WebMCPBridge.tsx`, `CollectionWebMCPBridge.tsx`, `VRTryOn.tsx`, and the human cart implementation.
- Verified latest pre-run Vercel preview for the branch head is `READY`.
- Re-read the official 2026-08-26 WebMCP draft and checked the current annotations/cancellation model.
- Re-audited invalid-input, missing-design, busy-state, stale-state, cancellation, provider-error, unsupported-browser, cart, collection, navigation, and try-on boundaries from the code paths.

No functional code change is justified this run. The 13-tool surface remains coherent; adding another tool now would either duplicate existing state, automate a permission-sensitive action, expose an unimplemented human action, or combine side effects in a way that reduces recoverability.

## Failures found / fixes applied

No new functional failure was found this run. The previously reported failed Virtual Try-On preview remains historical and superseded by READY corrective previews. No production change or rollback was required.

## Remaining opportunities

1. Highest priority: run real `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable browser when such an environment becomes available.
2. In that runtime, explicitly test stale revisions, cancellation, provider failures, unsupported-browser fallback, collection availability, shared cart state, route changes/page refresh, duplicate calls, and all Virtual Try-On deterministic errors.
3. Continue auditing long-running generation/refinement for human-vs-agent state races; do not add a risky architectural revision system unless a concrete overwrite path is reproducible.
4. Keep schemas/descriptions compact and accurate; do not add tools merely to increase count.
5. Do not merge to `main` solely because preview builds pass.
6. Treat every new functional commit as unvalidated until its exact or corrective Vercel preview is confirmed `READY`.

## README

`README.md` documents the 13-tool surface, agent-use philosophy, revision/cancellation behavior, collection flow, Virtual Try-On privacy boundary, shared human/agent actions, and representative testing guidance. Keep detailed run history here rather than expanding README.

## Next run

Read this file first. Reverify repository identity, `main` isolation, branch head, and latest preview status. Attempt genuine WebMCP runtime inspection first if a compatible browser/testing surface becomes available. Otherwise perform another fresh end-to-end human-versus-agent interaction-cost audit and only ship code that materially improves speed/reliability without weakening current human behavior, privacy, state correctness, or build safety.