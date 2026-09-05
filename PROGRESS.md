# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts

- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production/current production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head before this handoff update: `c90f52ddfc049c328225be9035aec65cd35495fe`
- Compare before this update: 19 commits ahead of `main`, 0 behind; merge base is exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Vercel project: `crishirtpc`, linked to `UnknownGod2011/crishirt-perfect-corp`.
- Exact preview for `c90f52ddfc049c328225be9035aec65cd35495fe`: `dpl_8AAMKFuTpwVj9NmrcKU1WJDXmV6S`, state `READY`.
- Production remains on `main`; this WebMCP branch has not been promoted to production.
- Historical failed preview `4dcef318ea8913b0efc906e1450044ad2da4d320` remains superseded by corrective commit `6b7fdfe28c4b5a048beda4436a3ae9948aa86c7d` and subsequent READY previews.

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

All entry points feature-detect `document.modelContext`; unsupported browsers retain the existing human UI flow.

## Shared state, safety, and privacy

- Workspace mutations accept optional `expectedRevision`; stale calls return deterministic `STALE_STATE` rather than silently overwriting newer state.
- Perfect Corp generation/refinement and Virtual Try-On propagate the WebMCP execution `AbortSignal` to fetch.
- Collection catalog/cart behavior is shared between humans and agents through `src/config/collectionCatalog.ts`.
- Virtual Try-On human and agent execution share the same `generateVirtualTryOn` action.
- Camera permission, file picking, raw person-photo data, result-image bytes/URLs, and downloads remain human-controlled.
- No primary tool is a DOM-click, CSS-selector, or coordinate wrapper.

## Current WebMCP specification check

Freshly reverified on 2026-09-05 against the official Web Machine Learning Community Group **WebMCP Draft Community Group Report dated 2026-08-26**. The current target remains `document.modelContext` with `registerTool`, JSON Schema inputs, tool annotations, registration/execution cancellation via `AbortSignal`, `getTools()`, and `executeTool()`.

`consequentialHint` remains inappropriate for the currently exposed reversible workspace/cart operations and existing image-generation/try-on actions; the human site has no implemented checkout/payment action to expose.

Actual interactive `document.modelContext.getTools()` plus representative `executeTool()` validation in a genuinely WebMCP-capable browser remains unavailable from this automation environment and is explicitly unclaimed.

## Fresh full-journey audit — 2026-09-05

### Create / edit

Coverage remains strong: a single semantic state read exposes garment, side, design, placement, busy status, cart count, valid options, and revision. Compound configuration avoids selector-by-selector round trips; semantic placement removes visual dragging; generation/refinement reuse the existing Perfect Corp flow and support cancellation.

A generation→placement→cart mega-tool remains rejected because it would bundle distinct side effects and make partial-failure recovery less reliable for only a small round-trip saving.

### Concurrency / duplicate invocation

The only concrete hardening candidate remains a narrow race: two near-simultaneous WebMCP generation/refinement calls can theoretically both pass the React-backed busy check before React state propagation reflects the first call.

Preferred fix: a bridge-local synchronous `useRef` operation lock, acquired before the async provider operation and released in `finally`, while retaining current React busy state for the human UI.

A clean clone/build was attempted again this run before editing source, but the execution container still failed DNS resolution for `github.com` (`Could not resolve host: github.com`). Because the required build/test gate is unavailable, this functional patch remains intentionally unshipped rather than speculative.

### Cart

Human cart supports reading items/total and removing items; WebMCP covers those actions. There is no human quantity/update behavior to expose. The visible Checkout button has no implemented checkout behavior, so no agent checkout/payment tool is invented.

### Exclusive Collection

Covered through shared catalog logic: compact semantic listing plus add-to-cart by stable product ID. No agent-only duplicate catalog is maintained.

### Navigation

Covered semantically for Create, Virtual Try-On, Collection, and Cart without requiring agents to discover or click links.

### Virtual Try-On

Post-consent handoff is covered. Human photo acquisition remains intentionally human-controlled. Once a photo exists, an agent can inspect readiness, select an eligible existing cart item, invoke the same Perfect Corp action, receive deterministic success/failure state, and cancel execution.

### Camera / AR surfaces

No safe additional semantic action was found. Automating camera acquisition would weaken the intentional permission/privacy boundary.

## Tests and verification performed this run

- Verified the exact canonical repository identity and push/admin access.
- Read `PROGRESS.md` before evaluating changes.
- Verified `webmcp-agent-native` head was `c90f52ddfc049c328225be9035aec65cd35495fe` before this handoff update.
- Verified production `main` remains exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared branch to `main`: 19 ahead, 0 behind, merge base exactly production baseline.
- Confirmed exact prior branch-head preview `dpl_8AAMKFuTpwVj9NmrcKU1WJDXmV6S` is `READY`.
- Reverified the official 2026-08-26 WebMCP draft and current `document.modelContext` / `registerTool` API shape.
- Re-audited create/edit, cart, collection, navigation, try-on, privacy, unsupported-browser fallback, stale-state, cancellation, duplicate invocation, provider-failure, route-change, and refresh boundaries.
- Retried a clean local clone/build; container DNS still could not resolve `github.com`.

No functional code change is justified under the available validation conditions. The 13-tool surface remains coherent and production-safe.

## Failures found / fixes applied

- No active deployment failure exists; the exact prior branch-head preview is READY.
- Historical Virtual Try-On preview failure remains superseded by READY corrective previews.
- The theoretical duplicate async invocation race remains tracked and intentionally unpatched until a complete build/test path is available.
- Current blocker is transient container DNS resolution for `github.com`; this is a validation-environment limitation, not an application failure.
- No production change, rollback, deployment-config change, or unrelated repository action was performed.

## Remaining opportunities

1. Highest priority: perform real `document.modelContext.getTools()` discovery plus representative `executeTool()` calls in a WebMCP-capable browser/testing environment.
2. When a complete clone/build path is available, add and test the narrow bridge-local generation/refinement operation lock.
3. Runtime-test stale revisions, cancellation, provider failures, unsupported-browser fallback, duplicate calls, route changes/refresh, collection availability, shared cart state, and all Virtual Try-On deterministic errors.
4. Continue auditing long-running human-vs-agent races without introducing a broad architecture rewrite unless a concrete overwrite path is reproducible.
5. Keep schemas/descriptions compact, accurate, and semantically high leverage; do not add tools merely to increase count.
6. Do not merge to `main` solely because previews build successfully.
7. Treat every functional commit as unvalidated until its exact or corrective Vercel preview is confirmed `READY`.

## README

`README.md` currently documents the 13-tool surface, agent-use philosophy, revision/cancellation behavior, collection flow, Virtual Try-On privacy boundary, shared human/agent actions, and representative testing guidance. Keep detailed run history here instead of turning README into an internal log.

## Next run

Read this file first. Reverify repository identity, production isolation, branch head/divergence, and exact latest preview state. Attempt genuine WebMCP runtime inspection first if a compatible browser/testing surface becomes available. Retry a complete clean clone/build path; only if that succeeds, implement and fully test the narrow duplicate-generation/refinement lock. Otherwise continue the fresh human-versus-agent interaction-cost audit and do not ship speculative source changes.
