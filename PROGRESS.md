# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts

- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production baseline / current production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head before this handoff update: `28e48c2bff577f2bb0a73be322d6659209a99a98`
- Compare result before this update: 18 commits ahead of `main`, 0 behind; merge base is exactly the production baseline.
- Vercel project: `crishirtpc`, linked to `UnknownGod2011/crishirt-perfect-corp`.
- Production remains on `main` and has not been promoted or modified by this WebMCP work.
- Exact preview for `28e48c2bff577f2bb0a73be322d6659209a99a98`: deployment `dpl_9ybhAjwNuC5HahdMYXMemNu9tyxF`, state `READY`.
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

Reverified previously against the official Web Machine Learning Community Group WebMCP Draft Community Group Report dated 2026-08-26. The implementation target remains `document.modelContext.registerTool` with JSON Schema inputs, annotations such as `readOnlyHint` and `untrustedContentHint`, registration/execution cancellation, `getTools()`, and `executeTool()`.

`consequentialHint` remains inappropriate for the current CriShirt mutations because they alter reversible in-app workspace/cart state or invoke existing image-generation/try-on operations; there is no implemented payment/checkout action.

Actual interactive `document.modelContext.getTools()` plus representative `executeTool()` validation in a WebMCP-capable browser remains unavailable from this automation environment and is explicitly unclaimed.

## Fresh full-journey audit — 2026-09-05

### Create / edit

Coverage remains strong. One read gives garment, side, design, placement, busy, cart-count, valid-option, and revision state. Compound configure and generate calls remove selector round trips. Semantic placement removes visual dragging. Generation/refinement reuse current provider routes and cancellation.

A generation→placement→cart mega-tool remains rejected because it would hide multiple distinct side effects and make partial-failure recovery worse for only a small round-trip saving.

### Concurrency / duplicate invocation audit

The previously identified narrow race remains the only concrete hardening candidate: two near-simultaneous WebMCP generation/refinement calls can theoretically both pass the React-backed busy-state check before state propagation reflects the first dispatch.

The preferred fix remains a bridge-local `useRef` operation lock acquired synchronously before either async operation starts and released in `finally`, while retaining existing React busy state for the human UI.

This run retried the safe validation path before editing. A clean clone of the canonical branch again failed because the execution container could not resolve `github.com`. Because a functional patch cannot be locally built/tested in this environment, no speculative source change was shipped.

### Cart

The human cart supports reading items/total and removing items, and WebMCP covers those actions. There is no human quantity/update control. The visible Checkout button has no implemented checkout behavior, so no WebMCP checkout/payment tool is invented.

### Exclusive Collection

Covered through shared catalog logic: read compact products and add an available product by stable ID. No duplicated agent-only catalog exists.

### Navigation

Covered for Create, Virtual Try-On, Collection, and Cart without link discovery.

### Virtual Try-On

Post-consent agent handoff is covered. Human photo acquisition remains permission-sensitive and intentionally not agentized. The agent can inspect readiness, choose an eligible existing cart item, invoke the same Perfect Corp action, receive deterministic semantic success/failure state, and cancel execution.

### AR/camera surfaces

No safe additional semantic mutation was found. Camera access still requires browser permission and direct human acquisition; automating it would weaken the intentional privacy boundary.

## Tests and verification performed this run

- Verified exact canonical repository identity and admin/push access.
- Re-read `PROGRESS.md` before evaluating changes.
- Verified `webmcp-agent-native` head was `28e48c2bff577f2bb0a73be322d6659209a99a98` before this handoff update.
- Verified `main` is still exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared branch against `main`: ahead 18, behind 0, merge base exactly the production baseline.
- Confirmed exact branch-head preview `dpl_9ybhAjwNuC5HahdMYXMemNu9tyxF` is `READY`.
- Re-audited create/edit, cart, collection, navigation, try-on, privacy, unsupported-browser fallback, stale-state, cancellation, duplicate invocation, and provider-failure boundaries.
- Retried a clean local clone for complete-file patch/build validation; container DNS still could not resolve `github.com`.

No functional code change is justified under the available validation conditions this run. The 13-tool surface remains coherent and production-safe.

## Failures found / fixes applied

- No active deployment failure exists. The current branch-head preview is READY.
- The historical Virtual Try-On failed preview remains superseded by READY corrective previews.
- The theoretical duplicate async invocation race remains tracked but intentionally unpatched until a complete build/test path is available.
- The local validation environment still has a transient DNS resolution failure for `github.com`; this is a validation-environment limitation, not an application failure.
- No production change or rollback was required.

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

Read this file first. Reverify repository identity, `main` isolation, branch head, and latest preview status. Attempt genuine WebMCP runtime inspection first if a compatible browser/testing surface becomes available. Retry a complete local clone/build path; only if that succeeds, implement and test the narrow duplicate-generation/refinement lock. Otherwise continue the fresh human-versus-agent interaction-cost audit and do not ship speculative code.
