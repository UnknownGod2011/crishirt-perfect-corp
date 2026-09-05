# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts

- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production/current production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this run: `32488f5c79606e6eb20d3ac316bdc226c795f78a`
- Compare entering this run: 34 commits ahead of `main`, 0 behind; merge base remains exactly production baseline `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Exact preview for `32488f5c79606e6eb20d3ac316bdc226c795f78a`: `dpl_5aP4pEKNEAFEDb5esDzAhAceeSPF`, state `READY` as verified on 2026-09-06.
- Production remains on `main`; this WebMCP branch has not been promoted to production.
- Historical failed Virtual Try-On preview remains superseded by corrective commit `6b7fdfe28c4b5a048beda4436a3ae9948aa86c7d` and subsequent READY previews.

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

Freshly reverified on 2026-09-06 against the official Web Machine Learning Community Group **WebMCP Draft Community Group Report dated 2026-09-04**.

The implementation target remains correct: secure-context `document.modelContext`, semantic `registerTool`, JSON Schema `inputSchema`, registration cancellation, execution `AbortSignal`, `getTools()`, and `executeTool()`.

The current spec continues to define tool annotations including `readOnlyHint`, `untrustedContentHint`, and `consequentialHint`. The existing CriShirt surface does not implement checkout/payment, account changes, publishing, or comparable significant non-reversible external actions, so no consequential annotation change is justified.

The official spec still links the Web Platform Tests result surface at `wpt.fyi/results/webmcp`. No new spec change observed this run requires an architecture rewrite. Actual interactive `document.modelContext.getTools()` plus representative `executeTool()` validation in a genuinely WebMCP-capable browser remains unavailable from this automation environment and is explicitly unclaimed.

## Fresh full-journey audit — 2026-09-06 04:23 IST

### Create / edit

Coverage remains strong. One compact state read exposes garment configuration, front/back design presence and placement, busy state, cart count, valid product options, current route, and a revision token. Compound configuration avoids repeated selector interactions; placement is semantic instead of visual dragging; generation/refinement reuse the existing Perfect Corp-backed application path and support cancellation.

A generation -> placement -> cart mega-tool remains rejected because it combines distinct side effects and weakens partial-failure recovery for only a small round-trip saving.

### Concurrency / duplicate invocation

The previously identified generation/refinement race remains present by direct source inspection. Both tools read React-backed `isGenerating`/`isRefining` state and only then dispatch their busy flags. Because `stateRef` updates after React state propagation, two near-simultaneous calls can both pass the busy check before the second render/effect updates the ref.

Fresh audit also identified the same general propagation window for fast retry-like state mutations. `crishirt_add_current_design_to_cart` can theoretically be invoked twice before the cart state/revision is reflected in `stateRef`, creating duplicate cart items even when the caller reused the same `expectedRevision`. Similar immediate retries of configuration/placement/remove operations can pass the same revision check before React propagation, although their practical impact ranges from idempotent reapplication to misleading duplicate success responses. This is narrower than a broad architecture defect, but it means `expectedRevision` is currently optimistic stale-state protection rather than an atomic mutation gate.

The preferred hardening remains lightweight and local: a synchronous bridge mutation/operation guard or equivalent immediate revision claim, with generation/refinement sharing an async operation lock and cart-changing operations gaining deterministic duplicate/retry behavior. Any fix must remain compatible with the human UI and avoid a state-management rewrite.

This run intentionally did not ship that functional hardening. A fresh clean clone/build attempt failed before checkout with `Could not resolve host: github.com`. The connected GitHub API and Vercel previews remain available, but they do not provide the independent local unit/integration/build gate requested for concurrency changes. Shipping a broader mutation guard without that gate would violate the conservative stability requirement.

### Cart

Human cart supports reading items/total and removing items; WebMCP covers those actions. There is no human quantity/update behavior to expose. The visible Checkout control has no implemented checkout behavior, so no agent checkout/payment tool is invented.

The new audit priority is retry safety rather than adding cart capability: duplicate add/remove attempts should eventually become deterministic without changing normal human behavior.

### Exclusive Collection

Covered through shared catalog logic: compact semantic listing plus add-to-cart by stable product ID. No agent-only duplicate catalog is maintained. Collection add-to-cart should be included in the same future retry/race validation as workspace cart mutations.

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
- Verified branch head `32488f5c79606e6eb20d3ac316bdc226c795f78a` entering this run.
- Verified production `main` remains exactly `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared branch to `main`: 34 ahead, 0 behind, merge base exactly production baseline.
- Confirmed exact branch-head Vercel preview `dpl_5aP4pEKNEAFEDb5esDzAhAceeSPF` is `READY`.
- Re-inspected `src/components/WebMCPBridge.tsx`, including generation, refinement, current-design cart add, cart read/remove, and semantic navigation.
- Reconfirmed the generation/refinement duplicate-call timing window and identified the related optimistic-revision window for rapid retry-like cart/configuration mutations.
- Retried a clean checkout/build command (`git clone` followed by the intended install/build path); it failed before checkout with DNS resolution error for `github.com`.
- Reverified the official 2026-09-04 WebMCP draft and linked WPT surface.
- Re-audited create/edit, cart, collection, navigation, try-on, privacy, unsupported-browser fallback, stale state, cancellation, duplicate invocation, provider failure, route changes, refresh, payload size, tool count, annotations, and agent round-trip boundaries.
- Protected Vercel preview remains authentication-gated when fetched directly; deployment state is therefore used only as build/deployment evidence, not claimed as interactive WebMCP runtime validation.

No functional code change is justified under the available validation conditions. The 13-tool surface remains coherent and production-safe by inspection and prior READY preview evidence, with retry/concurrency hardening now the clearest remaining code opportunity once full validation is available.

## Failures found / fixes applied

- No active deployment failure exists; the exact audited branch-head preview is READY.
- Generation/refinement duplicate async invocation race remains tracked and intentionally unpatched until a complete build/test path is available.
- Newly recorded: optimistic revision checks are not atomic against near-simultaneous WebMCP mutations; duplicate cart add/retry behavior is the highest-impact additional case to harden.
- Current blocker is the absence of a complete independent local clone/build/test path in this automation environment; the latest attempt again failed transient DNS resolution for `github.com`.
- No production change, rollback, deployment-config change, or unrelated repository action was performed.

## Remaining opportunities

1. Highest priority: perform real `document.modelContext.getTools()` discovery plus representative `executeTool()` calls in a WebMCP-capable browser/testing environment.
2. When a complete clone/build/test path is available, add and test a narrow synchronous operation/mutation guard: generation/refinement must reject overlap immediately; cart mutations should have deterministic duplicate/retry handling; avoid a state architecture rewrite.
3. Runtime-test stale revisions, repeated same-revision mutations, cancellation, provider failures, unsupported-browser fallback, duplicate calls, route changes/refresh, collection availability, shared cart state, and Virtual Try-On deterministic errors.
4. Explicitly test collection add-to-cart and workspace add-to-cart for rapid duplicate invocation and make the smallest safe change justified by reproduced behavior.
5. Continue auditing long-running human-vs-agent races without a broad architecture rewrite unless a concrete overwrite path is reproducible.
6. Keep schemas/descriptions/annotations compact, accurate, and semantically high leverage; do not add tools or hints merely to increase count.
7. Do not merge to `main` solely because previews build successfully.
8. Treat every functional commit as unvalidated until both its build and relevant behavioral checks pass.

## README

`README.md` currently documents the 13-tool surface, agent-use philosophy, revision/cancellation behavior, collection flow, Virtual Try-On privacy boundary, shared human/agent actions, and representative testing guidance. Keep detailed run history here instead of turning README into an internal log.

## Latest commit SHA

Latest audited working-branch commit entering this run: `32488f5c79606e6eb20d3ac316bdc226c795f78a`. This file is updated before the run's documentation commit is created, so the resulting new commit SHA is verified and recorded by the following run rather than attempting an impossible self-referential commit hash.

## Next run

Read this file first. Reverify repository identity, production isolation, branch head/divergence, and exact latest preview state. Check the latest official WebMCP draft for changes. Attempt genuine WebMCP runtime inspection first if a compatible browser/testing surface becomes available. Retry a complete clean clone/build/test path; only if that succeeds, reproduce and then implement the smallest safe synchronous guard for generation/refinement plus deterministic retry handling for cart-changing mutations. Otherwise continue the fresh human-versus-agent interaction-cost and race audit without shipping speculative source changes.
