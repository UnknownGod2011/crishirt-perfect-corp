# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts

- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this audit: `eff99fbc2c24ed3391c2f179898a20852b99db6d`
- Compare entering this audit: 45 commits ahead of `main`, 0 behind; merge base is exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Exact preview for `eff99fbc2c24ed3391c2f179898a20852b99db6d`: deployment `dpl_E55Lsy6MYuCPNMxR91R8XACYKVwp`, state `READY`, verified 2026-09-06.
- Build logs for that exact preview confirm `npm install` followed by `tsc -b && vite build`; Vite transformed 2020 modules and completed successfully.
- Production remains on `main`; this WebMCP branch has not been promoted.
- No production deployment configuration, environment variable, commerce, auth, database, or unrelated UI change was made in this audit.

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
- Perfect Corp generation/refinement and Virtual Try-On propagate the WebMCP execution `AbortSignal` to fetch.
- Collection catalog/cart behavior is shared between humans and agents through `src/config/collectionCatalog.ts`.
- Virtual Try-On humans and agents share the same `generateVirtualTryOn` action.
- Camera permission, file picking, raw person-photo data, generated try-on result bytes/URLs, and downloads remain human-controlled.
- No primary tool is a DOM-click, CSS-selector, coordinate-click, or visual wrapper.

## Current official WebMCP specification check

Freshly reverified on 2026-09-06 against the official Web Machine Learning Community Group **WebMCP Draft Community Group Report dated 2026-09-04**.

The implementation target remains correct: secure-context `document.modelContext`, semantic `registerTool`, JSON Schema `inputSchema`, registration cancellation, execution `AbortSignal`, `getTools()`, and `executeTool()`.

No current specification change justifies an architecture rewrite or new product behavior.

## Fresh full-journey audit — 2026-09-06 15:22 IST

### Repository / production isolation

Repository identity, write access, working branch, production baseline, divergence, and exact preview status were rechecked before any mutation. The working branch remains isolated from production and 0 commits behind `main`.

The branch diff remains scoped to WebMCP bridge/integration work, shared collection catalog extraction required for human/agent parity, README WebMCP documentation, and this durable progress log. No unrelated repository or production configuration was modified.

### Create / edit

`crishirt_get_workspace_state` still collapses garment state, front/back design presence, placement, busy state, cart count, valid product options, route, and revision into one compact observation. `crishirt_configure_workspace` and `crishirt_set_design_placement` continue to replace multiple visual selectors and drag/resize/rotate interactions with bounded semantic actions.

No new compound create tool is justified. Bundling generation, placement, and cart mutation would save a small number of calls but worsen partial-failure recovery and obscure state transitions.

### Generation / refinement concurrency

Fresh source inspection again confirms the narrow overlap window. `crishirt_generate_design` and `crishirt_refine_design` check React-backed `isGenerating` / `isRefining` state before dispatching their busy flags. Because `stateRef` only observes those flags after React propagation, sufficiently close invocations can both pass the initial guard.

The smallest safe design remains a synchronous in-memory operation guard shared by generation and refinement, acquired before the provider call and released in `finally`, while retaining React busy flags for the human UI.

That functional change was not shipped in this audit because the requested behavioral gate is still unavailable: a clean local checkout failed with `Could not resolve host: github.com`, and this runtime still lacks a WebMCP-capable browser execution surface. Hosted build health is proven, but changing shared concurrency semantics without a targeted behavioral test would be unnecessarily risky.

### Revision / cart race

Optimistic `expectedRevision` validation remains non-atomic for extremely close synchronous mutations because `revisionRef` advances when React state propagation is observed. Two rapid add-to-cart calls can therefore validate the same revision before the first dispatch becomes visible.

Focused same-revision reservation / duplicate protection remains preferable to a global state rewrite. It should only be shipped together with a targeted behavior test.

### Cart

The stable human cart actions remain covered semantically: inspect cart, add current configured apparel/design, add supported collection products, and remove an existing item. No quantity-update or checkout tool is added because the stable human site does not expose a corresponding shared action.

### Exclusive Collection

Fresh inspection of `CollectionWebMCPBridge.tsx` confirms `crishirt_list_collection` exposes stable IDs, category, price, availability, and image path without visual card inspection, while `crishirt_add_collection_item_to_cart` reuses the same catalog/cart model as the human collection page and rejects unavailable items. No agent-only behavior is introduced.

### Navigation

Create, Virtual Try-On, Collection, and Cart remain directly reachable through one bounded navigation tool. Route-specific micro-tools would increase discovery burden without meaningful benefit.

### Virtual Try-On

Fresh inspection of `VRTryOn.tsx` confirms the privacy boundary remains appropriate. Readiness exposes only semantic state and eligible cart item IDs; raw person-photo data and generated result bytes are not exposed. `crishirt_run_virtual_tryon` reuses the human application action and propagates cancellation.

Unlike generation/refinement, try-on sets `loadingRef.current = true` synchronously before awaiting the provider call and clears it in `finally`, so immediate duplicate executions are guarded without waiting for React state propagation.

### Schemas / payloads / annotations / recovery

The 13-tool surface remains coherent and high-leverage. Inputs are bounded to existing product capabilities; read tools are compact; `readOnlyHint` / `untrustedContentHint` are used where appropriate; errors are structured and deterministic; cancellable provider operations receive execution signals.

No new tiny wrappers, payload expansion, or tool-count increase is justified in this audit.

### Unsupported browser / refresh / lifecycle

All bridges feature-detect `document.modelContext`, preserving the normal human website when WebMCP is unavailable. Registration lifetime remains tied to component lifetime via abort controllers. No lifecycle rewrite is justified without browser-side evidence.

## Tests and verification performed this audit

- Read `PROGRESS.md` before considering changes.
- Verified canonical repository `UnknownGod2011/crishirt-perfect-corp` and write access.
- Verified working branch `webmcp-agent-native` at exact entering head `eff99fbc2c24ed3391c2f179898a20852b99db6d`.
- Verified production `main` remains `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared branch against production: 45 commits ahead, 0 behind, merge base exactly the production baseline.
- Re-inspected `src/components/WebMCPBridge.tsx`, especially revision validation, generation/refinement busy handling, cancellation, schemas, placement, cart, and navigation.
- Re-inspected `src/components/CollectionWebMCPBridge.tsx` for semantic catalog/cart parity and availability errors.
- Re-inspected `src/components/VRTryOn.tsx` for readiness privacy, synchronous overlap protection, cancellation, provider failures, and shared human/agent action use.
- Reverified the official WebMCP Draft Community Group Report dated 2026-09-04.
- Verified exact Vercel deployment `dpl_E55Lsy6MYuCPNMxR91R8XACYKVwp` for commit `eff99fbc...` is `READY`.
- Verified the exact deployment build executed `tsc -b && vite build` successfully and transformed 2020 modules.
- Retried a clean local clone for an independent behavioral/build harness; it failed before checkout with `Could not resolve host: github.com`.
- Re-audited create/edit, generation/refinement, cart, collection, navigation, try-on, unsupported-browser fallback, stale state, duplicate invocation, cancellation, provider-failure boundaries, refresh/route handling, payload size, and tool count.

## Failures found / fixes applied

- No deployment failure: the exact entering commit preview is `READY` and its production build passes.
- Generation/refinement overlap remains a verified source-level race candidate.
- Optimistic revision checks remain non-atomic for sufficiently close calls; duplicate cart add remains the clearest associated risk.
- Clean local checkout remains blocked by transient DNS resolution for `github.com` in this execution environment.
- Actual browser-side `document.modelContext.getTools()` / `executeTool()` validation remains unavailable in this runtime.
- No speculative functional source change was shipped.
- No production, deployment-config, unrelated repository, or UI change was made.

## Remaining opportunities

1. Execute real `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable browser/testing surface.
2. Reproduce simultaneous generation/refinement, then add the smallest synchronous shared operation guard and verify duplicate rejection, cancellation, failure cleanup, and successful release.
3. Reproduce same-revision duplicate cart mutation, then add focused revision reservation / duplicate protection without rewriting global state.
4. Add lightweight tests for stale revisions, repeated same-revision mutation, cancellation, provider failure, unsupported-browser fallback, collection availability, route refresh, shared cart state, and Virtual Try-On errors when a safe harness becomes available.
5. Continue auditing schemas, descriptions, annotations, payload size, round trips, and recovery behavior without growing the tool surface unnecessarily.
6. Do not merge to `main` solely because previews build successfully.

## README

`README.md` already contains a concise WebMCP philosophy/capability/testing section. No README change is justified in this audit; detailed run history belongs here.

## Latest commit SHA

Latest audited working-branch commit entering this audit: `eff99fbc2c24ed3391c2f179898a20852b99db6d`.

This file is updated before the audit documentation commit is created, so the resulting documentation commit SHA is intentionally recorded by the following run rather than attempting a self-referential hash.

## Next run

Read this file first. Reverify repo/branch/production isolation and exact preview status. Recheck the official WebMCP draft. Retry a clean checkout or obtain a real browser execution surface; if either provides a targeted behavioral harness, reproduce the generation/refinement overlap first and ship only the smallest synchronous guard with behavior plus full-build validation. Otherwise continue a fresh human-vs-agent interaction-cost/race audit and do not ship speculative functional code.
