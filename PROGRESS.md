# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts

- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production/current production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head before this handoff update: `0acc9974ce23ed340b14844240f8cf41a5a69655`
- Compare before this update: 26 commits ahead of `main`, 0 behind; merge base remains exactly production baseline `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`), linked to `UnknownGod2011/crishirt-perfect-corp`.
- Exact preview for `0acc9974ce23ed340b14844240f8cf41a5a69655`: `dpl_GeX3EcbRCVuyBtNmNQaFvDaREQAu`, state `READY`.
- Production remains on `main`; this WebMCP branch has not been promoted to production.
- Historical failed Virtual Try-On preview `4dcef318ea8913b0efc906e1450044ad2da4d320` remains superseded by corrective commit `6b7fdfe28c4b5a048beda4436a3ae9948aa86c7d` and subsequent READY previews.

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

- Workspace mutations accept optional `expectedRevision`; stale calls return deterministic `STALE_STATE` instead of silently overwriting newer state.
- Perfect Corp generation/refinement and Virtual Try-On propagate WebMCP execution `AbortSignal` to fetch.
- Collection catalog/cart behavior is shared between humans and agents through `src/config/collectionCatalog.ts`.
- Virtual Try-On human and agent execution share the same `generateVirtualTryOn` action.
- Camera permission, file picking, raw person-photo data, result-image bytes/URLs, and downloads remain human-controlled.
- No primary tool is a DOM-click, CSS-selector, coordinate-click, or brittle visual wrapper.

## Current WebMCP specification check

Freshly reverified on 2026-09-05 against the official Web Machine Learning Community Group **WebMCP Draft Community Group Report dated 2026-09-04**.

The implementation target remains correct: secure-context `document.modelContext`, semantic `registerTool`, JSON Schema `inputSchema`, annotations such as `readOnlyHint` / `untrustedContentHint` where appropriate, registration cancellation, execution `AbortSignal`, `getTools()`, and `executeTool()`.

The official spec links the Web Platform Tests result surface at `wpt.fyi/results/webmcp`; no spec change observed this run requires a CriShirt architecture rewrite. Actual interactive `document.modelContext.getTools()` plus representative `executeTool()` validation in a genuinely WebMCP-capable browser remains unavailable from this automation environment and is explicitly unclaimed.

## Fresh full-journey audit — 2026-09-05 20:21 IST

### Create / edit

Coverage remains strong. One compact state read exposes garment configuration, front/back design presence and placement, busy state, cart count, valid product options, current route, and a revision token. Compound configuration avoids repeated selector interactions; placement is semantic instead of visual dragging; generation/refinement reuse the existing Perfect Corp-backed application path and support cancellation.

A generation -> placement -> cart mega-tool remains rejected because it combines distinct side effects and weakens partial-failure recovery for only a small round-trip saving.

### Concurrency / duplicate invocation

The previously identified narrow race remains present by direct source inspection. `crishirt_generate_design` checks React-backed `stateRef.current.isGenerating/isRefining` before dispatching `SET_GENERATING`; two near-simultaneous WebMCP calls can theoretically enter before React propagation updates `stateRef`. Refinement has the same class of timing window.

Preferred fix remains a bridge-local synchronous `useRef` operation lock acquired immediately before provider execution and released in `finally`, shared by generation and refinement so same-operation and cross-operation duplicates are rejected deterministically with `WORKSPACE_BUSY`.

A clean clone/build was attempted again before touching functional source. The execution container still failed DNS resolution for `github.com` (`Could not resolve host: github.com`). Because the required complete build/test gate is unavailable, the functional lock patch remains intentionally unshipped rather than speculative.

### Cart

Human cart supports reading items/total and removing items; WebMCP covers those actions. There is no human quantity/update behavior to expose. The visible Checkout button has no implemented checkout behavior, so no agent checkout/payment tool is invented.

### Exclusive Collection

Covered through shared catalog logic: compact semantic listing plus add-to-cart by stable product ID. No agent-only duplicate catalog is maintained.

### Navigation

Covered semantically for Create, Virtual Try-On, Collection, and Cart without requiring agents to discover or click links.

### Virtual Try-On

Post-consent handoff remains covered. Human photo acquisition stays intentionally human-controlled. Once a photo exists, an agent can inspect readiness, select an eligible existing cart item, invoke the same Perfect Corp action, receive deterministic success/failure state, and cancel execution.

### Camera / AR surfaces

No safe additional semantic action is justified. Automating camera acquisition would weaken the intended permission/privacy boundary.

### Tool ergonomics / payload / round trips

No new tool is justified. The 13-tool surface remains coherent: state reads are compact, configuration/generation avoid unnecessary selector round trips, stable IDs are used for collection/cart operations, and side-effect boundaries remain explicit enough for recovery. Adding tiny setter tools or a broad mega-tool would worsen discoverability or failure handling.

## Tests and verification performed this run

- Read `PROGRESS.md` before evaluating changes.
- Verified repository identity as `UnknownGod2011/crishirt-perfect-corp` and working branch `webmcp-agent-native`.
- Verified branch head `0acc9974ce23ed340b14844240f8cf41a5a69655` before this handoff update.
- Verified production `main` remains exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared branch to `main`: 26 ahead, 0 behind, merge base exactly production baseline.
- Confirmed exact prior branch-head Vercel preview `dpl_GeX3EcbRCVuyBtNmNQaFvDaREQAu` is `READY`.
- Re-inspected `src/components/WebMCPBridge.tsx` and reconfirmed the duplicate-call timing window without modifying source.
- Reverified the official 2026-09-04 WebMCP draft; `document.modelContext`, `registerTool`, schemas, cancellation, `getTools()`, `executeTool()`, and linked WPT coverage remain the correct target.
- Re-audited create/edit, cart, collection, navigation, try-on, privacy, unsupported-browser fallback, stale state, cancellation, duplicate invocation, provider failure, route changes, refresh, payload size, tool count, and agent round-trip boundaries.
- Retried a clean local clone/build; container DNS still could not resolve `github.com`.

No functional code change is justified under the available validation conditions. The 13-tool surface remains coherent and production-safe by inspection and prior READY preview evidence.

## Failures found / fixes applied

- No active deployment failure exists; the exact prior branch-head preview is READY.
- Historical Virtual Try-On preview failure remains superseded by READY corrective previews.
- The duplicate async invocation race remains tracked and intentionally unpatched until a complete build/test path is available.
- Current blocker is transient container DNS resolution for `github.com`; this is a validation-environment limitation, not an application failure.
- No production change, rollback, deployment-config change, or unrelated repository action was performed.

## Remaining opportunities

1. Highest priority: perform real `document.modelContext.getTools()` discovery plus representative `executeTool()` calls in a WebMCP-capable browser/testing environment.
2. When a complete clone/build path is available, add and test the narrow shared generation/refinement operation lock.
3. Runtime-test stale revisions, cancellation, provider failures, unsupported-browser fallback, duplicate calls, route changes/refresh, collection availability, shared cart state, and Virtual Try-On deterministic errors.
4. Continue auditing long-running human-vs-agent races without a broad architecture rewrite unless a concrete overwrite path is reproducible.
5. Keep schemas/descriptions compact, accurate, and semantically high leverage; do not add tools merely to increase count.
6. Do not merge to `main` solely because previews build successfully.
7. Treat every functional commit as unvalidated until its exact or corrective Vercel preview is confirmed `READY`.

## README

`README.md` currently documents the 13-tool surface, agent-use philosophy, revision/cancellation behavior, collection flow, Virtual Try-On privacy boundary, shared human/agent actions, and representative testing guidance. Keep detailed run history here instead of turning README into an internal log.

## Latest commit SHA

This file is updated before the run commit is created, so the exact new commit SHA is recorded by the next run after branch-head verification. The pre-update branch head for this run was `0acc9974ce23ed340b14844240f8cf41a5a69655`.

## Next run

Read this file first. Reverify repository identity, production isolation, branch head/divergence, and exact latest preview state. Check the latest official WebMCP draft for changes. Attempt genuine WebMCP runtime inspection first if a compatible browser/testing surface becomes available. Retry a complete clean clone/build path; only if that succeeds, implement and fully test the narrow duplicate-generation/refinement lock. Otherwise continue the fresh human-versus-agent interaction-cost audit and do not ship speculative source changes.
