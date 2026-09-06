# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts

- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production/current production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this run: `c0439284ec20e3e84e8c67e7102046d3d6735e23`
- Compare entering this run: 38 commits ahead of `main`, 0 behind; merge base remains exactly production baseline `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Exact preview for `c0439284ec20e3e84e8c67e7102046d3d6735e23`: deployment `dpl_sgFfTZ5NrKp4EtsZPyTC5qhiiDf1`, state `READY` as verified on 2026-09-06.
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

All entry points feature-detect `document.modelContext`; unsupported browsers retain the existing human UI flow.

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

## Fresh full-journey audit — 2026-09-06 08:19 IST

### Create / edit

Coverage remains strong. `crishirt_get_workspace_state` exposes garment configuration, front/back design presence and placement, busy state, cart count, valid options, route, and a revision token in one semantic read. Compound workspace configuration removes repeated visual selector interactions. Placement is semantic rather than drag-based. Generation and refinement reuse the existing Perfect Corp-backed application paths and support cancellation.

A generation -> placement -> cart mega-tool remains rejected because it would combine distinct side effects and make partial-failure recovery less clear for only a small round-trip reduction.

### Concurrency / duplicate invocation

Direct source inspection again confirms the narrow generation/refinement timing window. Both tools consult React-backed `isGenerating` / `isRefining`, then dispatch the busy flag. `stateRef` updates only after React state propagation, so two near-simultaneous WebMCP calls can theoretically pass the busy check before the next render updates the ref.

The same propagation window remains relevant to rapid mutations guarded only by `expectedRevision`. Two near-simultaneous `crishirt_add_current_design_to_cart` calls can theoretically reuse the same expected revision before React state/revision propagation and produce duplicate cart items. Immediate retries of configuration, placement, or removal can similarly pass the same optimistic revision gate before propagation, although several of those outcomes are effectively idempotent.

The preferred hardening remains deliberately small: a synchronous local operation/mutation guard or immediate revision claim, with generation/refinement sharing an async operation lock and cart-changing operations receiving deterministic duplicate/retry behavior. A broad state-management rewrite is still unjustified.

This run did not ship that functional change because the required independent clean clone/build/integration gate remains unavailable. A fresh `git clone --branch webmcp-agent-native --single-branch https://github.com/UnknownGod2011/crishirt-perfect-corp.git` failed before checkout with `Could not resolve host: github.com`.

### Cart

Human cart behavior currently supports inspection and removal; WebMCP covers both plus the existing add flow. There is no working human quantity-update behavior to expose, so no quantity tool is invented. The visible Checkout control has no implemented checkout/payment behavior, so no agent checkout/payment tool is added.

### Exclusive Collection

Covered through shared catalog logic with compact semantic listing and add-to-cart by stable product ID. No agent-only catalog copy exists. Collection add-to-cart remains in the future duplicate-invocation runtime-test set.

### Navigation

Covered semantically for Create, Virtual Try-On, Collection, and Cart without requiring agents to discover or click visual links.

### Virtual Try-On

Post-consent handoff remains covered. Photo acquisition stays intentionally human-controlled. Once a photo is available, an agent can inspect readiness, select an eligible existing cart item, invoke the same Perfect Corp action, receive deterministic success/failure state, and cancel execution.

### Camera / AR privacy boundary

No additional semantic automation is justified because automating camera acquisition or raw-photo transfer would weaken the intended user permission/privacy boundary and would expand beyond the current legitimate human workflow.

### Tool ergonomics / payload / round trips

No new tool is justified this run. The 13-tool surface remains coherent and high leverage. Tiny setter wrappers would increase discovery burden; broad mega-tools would hide state transitions and make partial failures harder to recover from. Current read tools already return compact structured state sufficient for planning follow-up actions.

## Tests and verification performed this run

- Read `PROGRESS.md` before considering changes.
- Verified repository identity as `UnknownGod2011/crishirt-perfect-corp`.
- Verified working branch `webmcp-agent-native` and exact entering head `c0439284ec20e3e84e8c67e7102046d3d6735e23`.
- Verified production `main` remains exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared branch to production: 38 commits ahead, 0 behind, merge base exactly the production baseline.
- Confirmed Vercel deployment `dpl_sgFfTZ5NrKp4EtsZPyTC5qhiiDf1` for exact commit `c0439284...` is `READY`.
- Authenticated-fetch tested the exact preview root and received HTTP 200.
- Re-inspected `src/components/WebMCPBridge.tsx`, including revision handling, generation/refinement busy checks, cancellation, semantic tool registration, cart add/remove, and navigation.
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

## Latest commit SHA

Latest audited working-branch commit entering this run: `c0439284ec20e3e84e8c67e7102046d3d6735e23`. This file is updated before the run's documentation commit is created, so the resulting new commit SHA is verified and recorded by the following run rather than attempting a self-referential commit hash.

## Next run

Read this file first. Reverify repository identity, production isolation, branch head/divergence, and exact latest preview state. Check the latest official WebMCP draft for changes. Attempt genuine WebMCP runtime inspection first if a compatible browser/testing surface becomes available. Retry a complete clean clone/build/test path; only if it succeeds, reproduce and implement the smallest safe synchronous guard for generation/refinement plus deterministic retry handling for cart-changing mutations. Otherwise continue the fresh human-versus-agent interaction-cost and race audit without shipping speculative source changes.
