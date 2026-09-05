# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts

- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production/current production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this run: `6a2564a7b8623520c0af3548b90e934c63e5a144`
- Compare entering this run: 29 commits ahead of `main`, 0 behind; merge base remains exactly production baseline `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`), linked to `UnknownGod2011/crishirt-perfect-corp`.
- Exact preview for `6a2564a7b8623520c0af3548b90e934c63e5a144`: `dpl_4QqjCBQD1p4D5wAqJ1M8NkeQydQi`, state `READY` as verified on 2026-09-05.
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

The implementation target remains correct: secure-context `document.modelContext`, semantic `registerTool`, JSON Schema `inputSchema`, registration cancellation, execution `AbortSignal`, `getTools()`, and `executeTool()`.

The current spec's `ToolAnnotations` dictionary contains `readOnlyHint`, `untrustedContentHint`, and `consequentialHint`. The existing CriShirt WebMCP surface does not perform checkout/payment, account changes, publishing, or other significant non-reversible external actions, so no consequential annotation change is justified.

The official spec still links the Web Platform Tests result surface at `wpt.fyi/results/webmcp`. No spec change observed this run requires a CriShirt architecture rewrite. Actual interactive `document.modelContext.getTools()` plus representative `executeTool()` validation in a genuinely WebMCP-capable browser remains unavailable from this automation environment and is explicitly unclaimed.

## Fresh full-journey audit — 2026-09-05 23:24 IST

### Create / edit

Coverage remains strong. One compact state read exposes garment configuration, front/back design presence and placement, busy state, cart count, valid product options, current route, and a revision token. Compound configuration avoids repeated selector interactions; placement is semantic instead of visual dragging; generation/refinement reuse the existing Perfect Corp-backed application path and support cancellation.

A generation -> placement -> cart mega-tool remains rejected because it combines distinct side effects and weakens partial-failure recovery for only a small round-trip saving.

### Concurrency / duplicate invocation

The previously identified narrow race remains present by direct source inspection. `crishirt_generate_design` and `crishirt_refine_design` both read React-backed busy state before their dispatch updates can synchronously propagate to `stateRef`. Two near-simultaneous WebMCP calls can therefore theoretically pass the busy check before React state catches up.

The preferred fix remains a bridge-local synchronous `useRef` operation lock shared by generation and refinement, acquired immediately before provider execution and released in `finally`, so same-operation and cross-operation duplicates return deterministic `WORKSPACE_BUSY`.

This run intentionally did not ship that patch. The automation still lacks a complete independent local clone/build/test path; prior clean-clone attempts fail container DNS resolution for `github.com`. Vercel preview builds are available and healthy, but a deployment build alone does not replace the requested unit/integration validation for a concurrency change. Shipping the race fix without that gate would violate the conservative stability requirement.

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
- Verified branch head `6a2564a7b8623520c0af3548b90e934c63e5a144` entering this run.
- Verified production `main` remains exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared branch to `main`: 29 ahead, 0 behind, merge base exactly production baseline.
- Confirmed exact branch-head Vercel preview `dpl_4QqjCBQD1p4D5wAqJ1M8NkeQydQi` is `READY`.
- Re-inspected `src/components/WebMCPBridge.tsx` and reconfirmed the duplicate-call timing window without modifying functional source.
- Reverified the official 2026-09-04 WebMCP draft and linked WPT surface.
- Re-audited create/edit, cart, collection, navigation, try-on, privacy, unsupported-browser fallback, stale state, cancellation, duplicate invocation, provider failure, route changes, refresh, payload size, tool count, annotations, and agent round-trip boundaries.

No functional code change is justified under the available validation conditions. The 13-tool surface remains coherent and production-safe by inspection and prior READY preview evidence.

## Failures found / fixes applied

- No active deployment failure exists; the exact audited branch-head preview is READY.
- Historical Virtual Try-On preview failure remains superseded by READY corrective previews.
- The duplicate async invocation race remains tracked and intentionally unpatched until a complete build/test path is available.
- Current blocker is the absence of a complete independent local clone/build/test path in this automation environment; prior attempts fail transient DNS resolution for `github.com`.
- No production change, rollback, deployment-config change, or unrelated repository action was performed.

## Remaining opportunities

1. Highest priority: perform real `document.modelContext.getTools()` discovery plus representative `executeTool()` calls in a WebMCP-capable browser/testing environment.
2. When a complete clone/build/test path is available, add and test the narrow shared generation/refinement operation lock.
3. Runtime-test stale revisions, cancellation, provider failures, unsupported-browser fallback, duplicate calls, route changes/refresh, collection availability, shared cart state, and Virtual Try-On deterministic errors.
4. Continue auditing long-running human-vs-agent races without a broad architecture rewrite unless a concrete overwrite path is reproducible.
5. Keep schemas/descriptions/annotations compact, accurate, and semantically high leverage; do not add tools or hints merely to increase count.
6. Do not merge to `main` solely because previews build successfully.
7. Treat every functional commit as unvalidated until both its build and relevant behavioral checks pass.

## README

`README.md` currently documents the 13-tool surface, agent-use philosophy, revision/cancellation behavior, collection flow, Virtual Try-On privacy boundary, shared human/agent actions, and representative testing guidance. Keep detailed run history here instead of turning README into an internal log.

## Latest commit SHA

Latest audited working-branch commit entering this run: `6a2564a7b8623520c0af3548b90e934c63e5a144`. This file is updated before the run's documentation commit is created, so the resulting new commit SHA is verified and recorded by the following run rather than attempting an impossible self-referential commit hash.

## Next run

Read this file first. Reverify repository identity, production isolation, branch head/divergence, and exact latest preview state. Check the latest official WebMCP draft for changes. Attempt genuine WebMCP runtime inspection first if a compatible browser/testing surface becomes available. Retry a complete clean clone/build/test path; only if that succeeds, implement and fully test the narrow duplicate-generation/refinement lock. Otherwise continue the fresh human-versus-agent interaction-cost audit and do not ship speculative source changes.
