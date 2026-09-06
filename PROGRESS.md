# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts

- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this audit: `829eaf99884eec875581e8f7ea2f35735dde48a3`
- Compare entering this audit: 41 commits ahead of `main`, 0 behind; merge base is exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Exact preview for `829eaf99884eec875581e8f7ea2f35735dde48a3`: `dpl_GiuVrfcPTCWKeHdgFS9aTBURjor9`, state `READY`, verified 2026-09-06.
- Build logs for that exact deployment confirm successful Git clone, `npm install`, and `npm run build` (`tsc -b && vite build`), with Vite completing a production build.
- Production remains on `main`; this WebMCP branch has not been promoted.
- No production deployment configuration or environment variables were changed in this audit.

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

## Fresh full-journey audit — 2026-09-06 11:20 IST

### Repository / production isolation

Repository identity, branch identity, production baseline, branch divergence, and the exact preview deployment were all rechecked before considering any mutation. The working branch remains isolated from production. The recursive repository tree was inspected from the exact branch head to confirm the expected app/backend/config/docs layout and avoid operating on another repo or stale branch.

### Create / edit

Coverage remains high leverage. `crishirt_get_workspace_state` gives the agent garment configuration, front/back design presence and placement, busy state, cart count, route, valid product options, and a revision token in one compact read. `crishirt_configure_workspace` replaces multiple selector interactions. `crishirt_set_design_placement` replaces visual drag/resize/rotate work with bounded semantic coordinates. Generation/refinement reuse the site's existing Perfect Corp-backed routes and support cancellation.

No broader compound tool is justified: combining generate + placement + cart would reduce only a small number of round trips while increasing side-effect blast radius and partial-failure ambiguity.

### Concurrency / duplicate invocation

Direct source inspection again confirms the concrete race in generation/refinement. Both tools check React-backed `isGenerating` / `isRefining`, then dispatch their busy state. `stateRef` only observes that later React state. Two sufficiently close WebMCP invocations can therefore both pass the busy check before React propagation.

The same non-atomic timing limitation applies to optimistic revision checks: two near-simultaneous mutations can validate the same `expectedRevision` before state/revision propagation. Duplicate add-to-cart remains the clearest practical cart case.

The preferred fix is still deliberately small: a synchronous in-memory operation guard shared by WebMCP generation/refinement, and focused deterministic duplicate/retry handling for cart mutations. A state-management rewrite is not justified.

This audit did **not** ship that functional patch. The exact current branch is build-valid on Vercel, but this runtime still lacks an executable WebMCP-capable browser/test path for reproducing the race before changing shared-state semantics. The installed browser-automation skill was inspected, but its required `agent-browser` executable is not present in the runtime (`command not found`). A temporary authenticated Vercel preview access path was successfully obtained, but without the browser executable it cannot be used to call `document.modelContext.getTools()` / `executeTool()` here.

### Cart

Existing human cart capabilities are semantically covered: inspect, add supported configured apparel/designs, add supported collection items, and remove. No quantity-update tool is added because the human site does not expose a stable quantity-update flow. No checkout/payment tool is added because no stable shared checkout action exists.

Rapid duplicate add remains the highest-value cart hardening target once behavioral execution is available.

### Exclusive Collection

`crishirt_list_collection` avoids visual card inspection and returns stable product IDs, category, price, availability, and image path. `crishirt_add_collection_item_to_cart` uses the same shared catalog/cart model as the human page and rejects unavailable items. No agent-only product behavior is introduced.

### Navigation

Create, Virtual Try-On, Collection, and Cart remain directly reachable through one bounded semantic navigation tool. Additional route tools would only increase discovery burden.

### Virtual Try-On

The privacy boundary remains appropriate. `crishirt_get_tryon_state` reports readiness and eligible cart item IDs without exposing the user photo or result bytes. `crishirt_run_virtual_tryon` reuses the shared application action, propagates cancellation, and returns deterministic errors. Camera/file acquisition remains human-controlled.

Unlike generation/refinement, try-on already sets `loadingRef.current` synchronously when starting, so it has a stronger immediate overlap guard.

### Schemas / payload size / annotations / recovery

The 13-tool surface remains coherent. Read tools are compact, schemas are bounded to existing product capabilities, `readOnlyHint` and `untrustedContentHint` are present where appropriate, and errors are structured rather than throwing opaque DOM/UI failures. No schema expansion or tiny setter wrappers are justified in this audit.

### Unsupported browser / refresh / route lifecycle

All bridges feature-detect `document.modelContext`; the human site remains usable without WebMCP. Registration lifetime is tied to component lifetime through registration abort controllers. No new safe change is justified without actual WebMCP browser execution.

## Tests and verification performed this audit

- Read `PROGRESS.md` before considering changes.
- Verified canonical repository `UnknownGod2011/crishirt-perfect-corp` and write access.
- Verified working branch `webmcp-agent-native` at exact head `829eaf99884eec875581e8f7ea2f35735dde48a3`.
- Verified production `main` remains exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared branch against production: 41 commits ahead, 0 behind, merge base exactly production baseline.
- Inspected the recursive tree from the exact branch head.
- Re-inspected `src/components/WebMCPBridge.tsx`, including revision checks, generation/refinement busy checks, cancellation, schemas, placement, cart, and navigation.
- Rechecked `package.json`: build is `tsc -b && vite build`; there is still no unit/integration test script or test framework configured.
- Reverified the official WebMCP draft dated 2026-09-04.
- Verified Vercel deployment `dpl_GiuVrfcPTCWKeHdgFS9aTBURjor9` for exact commit `829eaf9...` is `READY`.
- Inspected the exact deployment build log: clone succeeded, 2020 modules transformed, and production build completed successfully.
- Obtained a temporary authenticated access path for the exact protected Vercel preview.
- Inspected the browser-automation skill and attempted the prescribed runtime path; `agent-browser` is not installed, so actual `document.modelContext.getTools()` / `executeTool()` execution remains unavailable in this runtime.
- Re-audited create/edit, generation/refinement, cart, collection, navigation, try-on, unsupported-browser fallback, stale state, duplicate invocation, cancellation, provider failure boundaries, refresh/route handling, payload size, and tool count.

## Failures found / fixes applied

- No deployment failure: exact entering commit preview is `READY` and its build succeeds.
- Generation/refinement overlap remains a verified source-level race candidate.
- Optimistic revision checks remain non-atomic for sufficiently close calls; duplicate cart add is the clearest associated risk.
- Actual WebMCP browser execution is blocked in this runtime because the documented `agent-browser` executable is unavailable.
- No speculative functional source change was shipped.
- No production, deployment-config, unrelated repository, or UI change was made.

## Remaining opportunities

1. Execute real `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a WebMCP-capable browser/testing surface.
2. Reproduce simultaneous generation/refinement and duplicate cart mutations under controlled execution.
3. Once reproduced, add the smallest synchronous shared operation guard; do not rewrite application state architecture.
4. Add focused tests for stale revisions, repeated same-revision mutation, duplicate add, cancellation, provider failure, unsupported-browser fallback, collection availability, route refresh, shared cart state, and Virtual Try-On errors when a lightweight harness can be added safely.
5. Continue auditing schemas, descriptions, annotations, payload size, round trips, and recovery behavior without growing the tool surface unnecessarily.
6. Do not merge to `main` solely because previews build successfully.

## README

`README.md` already contains a concise WebMCP philosophy/capability/testing section. No README change is justified in this audit; detailed run history belongs here.

## Latest commit SHA

Latest audited working-branch commit entering this audit: `829eaf99884eec875581e8f7ea2f35735dde48a3`.

This file is updated before the audit documentation commit is created, so the resulting documentation commit SHA is intentionally recorded by the following run rather than attempting a self-referential hash.

## Next run

Read this file first. Reverify repo/branch/production isolation and exact preview status. Recheck the official WebMCP draft. Prefer obtaining actual browser execution or a safe lightweight behavioral harness; if available, reproduce the overlap window and ship only the smallest synchronous guard with build/behavior validation. Otherwise continue a fresh human-vs-agent interaction-cost/race audit and do not ship speculative functional code.
