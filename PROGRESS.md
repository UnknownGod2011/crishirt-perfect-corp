# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts

- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production/current production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this run: `57903f8f3a8839178af6035f42cd6def8143fbac`
- Compare entering this run: 39 commits ahead of `main`, 0 behind; merge base remains exactly production baseline `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Exact preview for `57903f8f3a8839178af6035f42cd6def8143fbac`: deployment `dpl_J7UQhycAVmRR5AJ4sTc4q87DdcpU`, state `READY` as verified on 2026-09-06.
- Authenticated fetch of that exact preview root returned HTTP 200 on 2026-09-06.
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

- Workspace mutations accept optional `expectedRevision`; stale calls return deterministic `STALE_STATE` instead of silently overwriting later state.
- Perfect Corp generation/refinement and Virtual Try-On propagate WebMCP execution `AbortSignal` to fetch.
- Collection catalog/cart behavior is shared between humans and agents through `src/config/collectionCatalog.ts`.
- Virtual Try-On human and agent execution share the same `generateVirtualTryOn` action.
- Camera permission, file picking, raw person-photo data, result-image bytes/URLs, and downloads remain human-controlled.
- No primary tool is a DOM-click, CSS-selector, coordinate-click, or brittle visual wrapper.

## Current WebMCP specification check

Freshly reverified on 2026-09-06 against the official Web Machine Learning Community Group **WebMCP Draft Community Group Report dated 2026-09-04**.

The implementation target remains correct: secure-context `document.modelContext`, semantic `registerTool`, JSON Schema `inputSchema`, registration cancellation, execution `AbortSignal`, `getTools()`, and `executeTool()`.

No newly observed specification change requires an architecture rewrite or additional tool surface.

## Fresh full-journey audit — 2026-09-06 09:22 IST

### Repository / deployment isolation

The repository identity, working branch, full recursive tree, branch divergence, and production baseline were rechecked before considering changes. The branch remains isolated from production and the latest exact branch-head preview is healthy. No unrelated repository, branch, deployment target, environment variable, or production configuration was touched.

### Create / edit

Coverage remains strong. `crishirt_get_workspace_state` exposes garment configuration, front/back design presence and placement, busy state, cart count, valid product options, route, and a revision token in one semantic read. `crishirt_configure_workspace` replaces multiple visual selector interactions with one structured mutation. `crishirt_set_design_placement` replaces drag/resize/rotate interpretation with bounded semantic coordinates. Generation and refinement reuse the site's existing Perfect Corp-backed application paths and propagate cancellation.

A generation -> placement -> cart mega-tool remains rejected because it would combine distinct side effects, obscure partial-failure recovery, and create a larger blast radius for only a small round-trip reduction.

### Concurrency / duplicate invocation

Direct source inspection again confirms the narrow generation/refinement timing window. Both tools consult React-backed busy state before dispatching the busy flag; `stateRef` updates only after React state propagation. Two near-simultaneous WebMCP calls can therefore theoretically pass the busy check before the next render updates the ref.

The same propagation limitation applies to optimistic revision checks. Two near-simultaneous mutations can theoretically validate the same `expectedRevision` before React state/revision propagation. The most important concrete case remains duplicate add-to-cart, including both current-design and collection add paths; repeated configuration, placement, or removal can also pass the same revision window, although several outcomes are effectively idempotent.

The preferred hardening remains deliberately small: a synchronous in-memory operation/mutation guard or immediate revision claim, with generation/refinement sharing an async operation lock and cart-changing operations receiving deterministic duplicate/retry behavior. A broad state-management rewrite remains unjustified.

This run did **not** ship that functional change because the required independent clean clone/build/integration gate is still unavailable. A fresh `git clone --branch webmcp-agent-native --single-branch https://github.com/UnknownGod2011/crishirt-perfect-corp.git` failed before checkout with `Could not resolve host: github.com`.

### Cart

Human cart behavior currently supports inspection and removal; WebMCP covers both plus the site's existing add flow. There is no working human quantity-update behavior to expose, so no quantity tool is invented. The visible Checkout control has no implemented checkout/payment behavior, so no agent checkout/payment tool is added.

### Exclusive Collection

Coverage remains compact and shared. `crishirt_list_collection` returns structured product IDs, availability, category, display price, and image path without forcing card inspection. `crishirt_add_collection_item_to_cart` calls the same shared collection/cart logic used by the human page. Its rapid duplicate-invocation behavior remains in the future runtime-test set.

### Navigation

Create, Virtual Try-On, Collection, and Cart are semantically navigable without visual link discovery. No additional route tool is justified because the remaining UI surfaces do not expose stable user journeys that need separate agent-only navigation.

### Virtual Try-On

The privacy boundary remains correct. `crishirt_get_tryon_state` reveals readiness and eligible cart item IDs without exposing person-photo or generated-result bytes. `crishirt_run_virtual_tryon` reuses the same `generateVirtualTryOn` application action after the human has supplied a photo, propagates cancellation, and returns deterministic provider/cancellation errors. Camera/file permission and raw photo acquisition remain intentionally human-controlled.

### Tool ergonomics / schemas / payload / round trips

The 13-tool surface remains coherent and high leverage. Read tools already return compact structured state suitable for planning; tiny setter wrappers would increase tool-discovery burden, while broader mega-tools would hide state transitions and make partial failures harder to recover from. Existing JSON Schemas remain bounded around current product capabilities rather than inventing agent-only functionality.

### Unsupported browser / refresh / route changes

All bridges feature-detect `document.modelContext`, so the normal website remains usable when WebMCP is unavailable. Tools are registered from React-mounted bridges and registration lifetime is tied to component lifecycle through abort controllers. No safe additional source change was identified here without runtime browser validation.

## Tests and verification performed this run

- Read `PROGRESS.md` before considering changes.
- Verified repository identity as `UnknownGod2011/crishirt-perfect-corp` and confirmed push/admin access only to the intended repository.
- Verified working branch `webmcp-agent-native` and exact entering head `57903f8f3a8839178af6035f42cd6def8143fbac`.
- Verified production `main` remains exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared branch to production: 39 commits ahead, 0 behind, merge base exactly the production baseline.
- Inspected the full recursive branch tree before editing.
- Confirmed Vercel deployment `dpl_J7UQhycAVmRR5AJ4sTc4q87DdcpU` for exact commit `57903f8f...` is `READY`.
- Authenticated-fetch tested that exact preview root and received HTTP 200.
- Re-inspected `src/components/WebMCPBridge.tsx`, including revision handling, generation/refinement busy checks, cancellation, semantic registration, workspace read/configuration/placement, cart operations, and navigation.
- Re-inspected `src/components/CollectionWebMCPBridge.tsx`, including compact collection listing, shared catalog lookup, availability checks, and add-to-cart behavior.
- Re-inspected `src/components/VRTryOn.tsx`, including privacy-safe state reporting, shared human/agent try-on execution, cancellation, busy handling, and deterministic errors.
- Reconfirmed the duplicate-call timing window and optimistic-revision limitation for near-simultaneous mutations.
- Retried a fresh clean local clone; it failed before checkout with DNS resolution error for `github.com`, so no functional concurrency patch was shipped.
- Reverified the official WebMCP draft dated 2026-09-04 and its `document.modelContext` / `registerTool` API surface.
- Re-audited create/edit, cart, collection, navigation, try-on, privacy boundary, unsupported-browser fallback, stale state, cancellation, duplicate invocation, provider failure, route changes, refresh, payload size, tool count, and agent round-trip boundaries.

## Failures found / fixes applied

- No active branch deployment failure exists; the exact entering branch-head preview is `READY` and serves HTTP 200.
- Generation/refinement duplicate async invocation race remains tracked and intentionally unpatched until full build/test validation is available.
- Optimistic revision checks remain non-atomic against near-simultaneous WebMCP mutations; duplicate cart add/retry behavior remains the highest-impact related case.
- The current blocker remains environmental DNS resolution for direct `github.com` access from the execution container. Connected GitHub and Vercel APIs work, but they do not replace the requested local build/integration validation gate for a concurrency change.
- No production change, rollback, deployment-config change, unrelated repository action, UI redesign, or speculative functional commit was performed.

## Remaining opportunities

1. Perform real `document.modelContext.getTools()` discovery and representative `executeTool()` calls in a genuinely WebMCP-capable browser/testing environment.
2. Once a complete clone/build/test path is available, reproduce and add the smallest synchronous operation/mutation guard: generation/refinement must reject overlap immediately and cart mutations should have deterministic duplicate/retry handling.
3. Runtime-test stale revisions, repeated same-revision mutations, cancellation, provider failures, unsupported-browser fallback, duplicate calls, route changes/refresh, collection availability, shared cart state, and Virtual Try-On deterministic errors.
4. Explicitly test collection and workspace add-to-cart under rapid duplicate invocation.
5. Continue auditing long-running human-vs-agent races without a broad architecture rewrite unless a concrete overwrite path is reproduced.
6. Keep schemas, descriptions, annotations, and payloads compact; do not add tools or hints merely to increase count.
7. Do not merge to `main` solely because previews build successfully.
8. Treat every future functional commit as unvalidated until both build and relevant behavioral checks pass.

## README

`README.md` currently documents the 13-tool surface, agent-use philosophy, revision/cancellation behavior, collection flow, Virtual Try-On privacy boundary, shared human/agent actions, and representative testing guidance. No README change was justified in this run; detailed run history belongs here in `PROGRESS.md`.

## Recent audit history

- `57903f8f3a8839178af6035f42cd6def8143fbac` — prior no-op audit; exact preview later verified `READY` and HTTP 200.
- `c0439284ec20e3e84e8c67e7102046d3d6735e23` — previous audit documenting the persistent build-validation blocker.
- Earlier WebMCP implementation commits on this branch introduced and hardened the current 13-tool semantic surface while leaving production `main` unchanged.

## Latest commit SHA

Latest audited working-branch commit entering this run: `57903f8f3a8839178af6035f42cd6def8143fbac`. This file is updated before the run's documentation commit is created, so the resulting new commit SHA is verified and recorded by the following run rather than attempting a self-referential commit hash.

## Next run

Read this file first. Reverify repository identity, production isolation, branch head/divergence, and exact latest preview state. Check the latest official WebMCP draft for changes. Attempt genuine WebMCP runtime inspection first if a compatible browser/testing surface becomes available. Retry a complete clean clone/build/test path; only if it succeeds, reproduce and implement the smallest safe synchronous guard for generation/refinement plus deterministic retry handling for cart-changing mutations. Otherwise continue the fresh human-versus-agent interaction-cost and race audit without shipping speculative source changes.
