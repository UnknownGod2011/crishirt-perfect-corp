# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts

- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production/current production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this run: `b3c4d86412be572a911992cd16baf9baeec099ac`
- Compare entering this run: 40 commits ahead of `main`, 0 behind; merge base is exactly production baseline `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Exact preview for `b3c4d86412be572a911992cd16baf9baeec099ac`: deployment `dpl_5aQZdxdyAB73fFZd9jT85jz35XY2`, state `READY`, verified on 2026-09-06.
- Authenticated fetch of that exact preview root returned HTTP 200 on 2026-09-06.
- Vercel build logs for that exact commit show the repository was cloned successfully in Vercel and `npm install` followed by `npm run build` completed successfully; the build command is `tsc -b && vite build` and Vite reported a successful production build.
- Production remains on `main`; this WebMCP branch has not been promoted to production.
- No production deployment configuration was changed this run.

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

All WebMCP entry points feature-detect `document.modelContext`; unsupported browsers retain the existing human UI flow.

## Shared state, safety, and privacy

- Workspace mutations accept optional `expectedRevision`; stale calls return deterministic `STALE_STATE` rather than silently overwriting later state.
- Perfect Corp generation/refinement and Virtual Try-On propagate WebMCP execution `AbortSignal` to fetch.
- Collection catalog/cart behavior is shared between humans and agents through `src/config/collectionCatalog.ts`.
- Virtual Try-On human and agent execution share the same `generateVirtualTryOn` application action.
- Camera permission, file picking, raw person-photo data, result-image bytes/URLs, and downloads remain human-controlled.
- No primary tool is a DOM-click, CSS-selector, coordinate-click, or brittle visual wrapper.

## Current WebMCP specification check

Freshly reverified on 2026-09-06 against the official Web Machine Learning Community Group **WebMCP Draft Community Group Report dated 2026-09-04**.

The implementation target remains correct: secure-context `document.modelContext`, semantic `registerTool`, JSON Schema `inputSchema`, registration cancellation, execution `AbortSignal`, `getTools()`, and `executeTool()`.

No newly observed specification change requires an architecture rewrite or additional tool surface.

## Fresh full-journey audit — 2026-09-06 10:20 IST

### Repository / production isolation

Repository identity, branch identity, production baseline, branch divergence, and the exact current branch deployment were rechecked before considering changes. The branch remains isolated from production. No unrelated repository, branch, environment variable, deployment target, or production configuration was touched.

### Create / edit

Coverage remains strong. `crishirt_get_workspace_state` gives the agent garment configuration, front/back design presence and placement, busy state, cart count, current route, valid product options, and a revision token in one compact semantic read. `crishirt_configure_workspace` replaces multiple visual selector operations with one structured mutation. `crishirt_set_design_placement` replaces drag/resize/rotate interpretation with bounded semantic coordinates. Generation and refinement reuse the existing Perfect Corp-backed application routes and pass through cancellation.

No additional mega-tool is justified. Combining generation, placement, and cart addition would increase side-effect blast radius and complicate partial-failure recovery for only a small round-trip reduction.

### Concurrency / duplicate invocation

Direct source inspection again confirms the narrow generation/refinement timing window. Both tools check React-backed `isGenerating` / `isRefining` state before dispatching the busy flag, while `stateRef` only observes the resulting state after React propagation. Two sufficiently close WebMCP invocations can therefore theoretically pass the busy check before the next state update reaches the ref.

The same propagation limitation applies to optimistic revision checks. Two near-simultaneous mutations can validate the same `expectedRevision` before React state/revision propagation. The clearest practical case remains duplicate add-to-cart, including both current-design and collection add paths. Configuration, placement, and removal can also share the timing window, though several outcomes are effectively idempotent.

The preferred hardening remains deliberately small: use synchronous in-memory mutation/operation guards or immediate revision claims, with generation/refinement sharing an async operation lock and cart-changing operations receiving deterministic duplicate/retry behavior. A broad state-management rewrite remains unjustified.

This run did **not** ship the functional concurrency change. The hosted Vercel build gate is now verified healthy for the current branch, but the execution container still cannot clone `github.com`, and there is no repository test script or available WebMCP-capable browser execution path in this runtime for reproducing and behaviorally validating the race before a source mutation. The current package scripts expose build/lint/preview but no unit/integration test runner.

### Cart

WebMCP covers the existing human cart capabilities: inspect, add existing supported products/designs, and remove. No quantity-update tool is added because the current human product does not expose a working quantity-update flow. No checkout/payment tool is added because the visible checkout control does not implement a stable checkout/payment action to share with agents.

Rapid duplicate add remains the highest-value cart hardening target for future behavioral validation.

### Exclusive Collection

`crishirt_list_collection` returns stable product IDs, category, price, availability, and image path without visual card inspection. `crishirt_add_collection_item_to_cart` uses the same shared catalog/cart model as the human page and correctly rejects unavailable products. No agent-only catalog behavior is invented.

### Navigation

Create, Virtual Try-On, Collection, and Cart remain semantically navigable through one bounded navigation tool. No extra route tools are justified.

### Virtual Try-On

The privacy boundary remains appropriate. `crishirt_get_tryon_state` returns readiness and eligible cart item IDs without exposing the human photo or generated result bytes. `crishirt_run_virtual_tryon` reuses the same `generateVirtualTryOn` action, propagates cancellation, and reports deterministic provider/cancellation errors. Camera/file permission and raw photo acquisition remain human-controlled.

The try-on implementation already updates `loadingRef.current` synchronously when starting, so it has a stronger immediate overlap guard than generation/refinement.

### Tool ergonomics / schemas / payload / round trips

The 13-tool surface remains coherent and high leverage. Read tools are compact enough for planning; tiny setter wrappers would increase discovery burden, while broader mega-tools would hide state transitions and recovery boundaries. Existing schemas are bounded around functionality the human site already supports.

### Unsupported browser / refresh / route changes

All bridges feature-detect `document.modelContext`; the normal site remains usable when WebMCP is unavailable. Registration lifetime is tied to React component lifetime through abort controllers. No safe additional change is justified here without actual WebMCP browser execution.

## Tests and verification performed this run

- Read `PROGRESS.md` before considering changes.
- Verified canonical repository `UnknownGod2011/crishirt-perfect-corp` and write access.
- Verified working branch `webmcp-agent-native` at exact entering head `b3c4d86412be572a911992cd16baf9baeec099ac`.
- Verified production `main` remains exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared branch against production: 40 commits ahead, 0 behind, merge base exactly the production baseline.
- Re-inspected `src/components/WebMCPBridge.tsx` for revision handling, generation/refinement busy checks, cancellation, schemas, semantic registration, workspace configuration/placement, cart operations, and navigation.
- Re-inspected `src/components/CollectionWebMCPBridge.tsx` for compact catalog reads, shared product lookup, availability validation, and cart mutation behavior.
- Re-inspected `src/components/VRTryOn.tsx` for privacy-safe state reporting, synchronous busy ref behavior, shared execution, provider errors, and cancellation.
- Reverified official WebMCP Draft Community Group Report dated 2026-09-04 and the `document.modelContext` / `registerTool` / `getTools()` / `executeTool()` API surface.
- Verified exact Vercel deployment `dpl_5aQZdxdyAB73fFZd9jT85jz35XY2` for commit `b3c4d864...` is `READY`.
- Authenticated-fetch tested the exact preview root and received HTTP 200.
- Inspected exact deployment build logs: Vercel cloned commit `b3c4d86`, ran `npm install`, ran `npm run build` (`tsc -b && vite build`), transformed 2020 modules, and completed the build/deployment successfully.
- Retried a fresh local clean clone in the execution container; it still failed before checkout with `Could not resolve host: github.com`.
- Rechecked package scripts and confirmed there is no current unit/integration test command or test framework configured in `package.json`.
- Re-audited create/edit, cart, collection, navigation, try-on, privacy, unsupported-browser fallback, stale state, duplicate invocation, cancellation, provider failure, refresh/route handling, payload size, tool count, and agent round-trip boundaries.

## Failures found / fixes applied

- No active deployment failure: the exact entering branch-head preview is `READY`, builds successfully, and serves HTTP 200.
- Generation/refinement overlapping invocation remains a narrow source-level race candidate and is intentionally unpatched until behavioral validation is possible.
- Optimistic revision checks remain non-atomic for sufficiently close calls; duplicate cart adds are the most concrete associated risk.
- Local direct GitHub DNS resolution remains unavailable in the execution container. This no longer blocks proving that the current branch builds because Vercel build logs provide that evidence, but it still blocks local reproduction/testing of a proposed functional patch in this runtime.
- No production change, rollback, deployment-config change, unrelated repository action, UI redesign, or speculative functional source commit was performed.

## Remaining opportunities

1. Execute actual `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a genuinely WebMCP-capable browser/testing surface.
2. Reproduce rapid duplicate generation/refinement and add-to-cart calls under controlled execution.
3. Once behavioral testing is available, implement the smallest synchronous operation/mutation guard rather than rewriting state architecture.
4. Add focused tests for stale revisions, repeated same-revision mutation, duplicate add, cancellation, provider failure, unsupported-browser fallback, collection availability, route refresh, shared cart state, and Virtual Try-On errors if a lightweight test harness can be introduced without destabilizing the app.
5. Keep tool schemas, annotations, descriptions, and payloads compact; do not add tools merely to increase surface area.
6. Do not merge to `main` solely because previews build successfully.

## README

`README.md` already contains the concise WebMCP philosophy, 13-tool capability summary, revision/cancellation behavior, collection flow, Virtual Try-On privacy boundary, shared human/agent actions, and testing guidance. No README change was justified this run; detailed hourly history belongs here.

## Recent audit history

- `b3c4d86412be572a911992cd16baf9baeec099ac` — entering commit for this run; exact Vercel preview verified `READY`, build logs verified `tsc -b && vite build`, and root returned HTTP 200.
- `57903f8f3a8839178af6035f42cd6def8143fbac` — prior no-op audit; exact preview subsequently verified healthy.
- `c0439284ec20e3e84e8c67e7102046d3d6735e23` — earlier audit documenting the local build-validation blocker.
- Earlier WebMCP implementation commits introduced and hardened the current 13-tool semantic surface while leaving production `main` unchanged.

## Latest commit SHA

Latest audited working-branch commit entering this run: `b3c4d86412be572a911992cd16baf9baeec099ac`. This file is updated before the run's documentation commit is created, so the resulting documentation commit SHA is verified and recorded by the following run rather than attempting a self-referential hash.

## Next run

Read this file first. Reverify repository identity, production isolation, branch head/divergence, and exact preview state. Check the current official WebMCP draft for changes. Prefer obtaining an actual WebMCP-capable execution path or a reproducible lightweight test harness; if available, reproduce the overlapping mutation window and implement only the smallest synchronous guard with tests. Otherwise continue the fresh human-versus-agent interaction-cost/race audit without speculative functional source changes.
