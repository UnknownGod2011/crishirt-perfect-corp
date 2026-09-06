# CriShirt WebMCP Progress

## Mission

Keep the existing human-facing CriShirt experience stable while exposing the same legitimate user capabilities to AI agents through semantic WebMCP tools. Do not expand into Shopify, login, Supabase, SerpApi, new commerce, or unrelated UI work.

## Canonical repository and deployment facts

- Repository: `UnknownGod2011/crishirt-perfect-corp`
- Production branch: `main`
- Production commit: `88daa417caa5305f81e5554977a13a94a793cdeb`
- Working branch: `webmcp-agent-native`
- Branch head entering this audit: `df9a8555ffce5099bf353f3ae83fc8d3aee10cd4`
- Compare entering this audit: 46 commits ahead of `main`, 0 behind; merge base is exactly production commit `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Vercel project: `crishirtpc` (`prj_jAm749oRS01LbAdwec2lKvKZgAEF`).
- Exact preview for `df9a8555ffce5099bf353f3ae83fc8d3aee10cd4`: deployment `dpl_G1fV84xMDEnVJwoGTF1otpHJ3sz9`, state `READY`, verified 2026-09-06.
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
- Collection catalog/cart behavior is shared between humans and agents through `src/config/collectionCatalog.ts`.
- Virtual Try-On humans and agents share the same `generateVirtualTryOn` action.
- Camera permission, file picking, raw person-photo data, generated try-on result bytes/URLs, and downloads remain human-controlled.
- No primary tool is a DOM-click, CSS-selector, coordinate-click, or visual wrapper.
- `src/webmcp/executeCompat.ts` normalizes CriShirt's older signal-aware handlers so they are callable by standards-style one-argument WebMCP execution while preserving registration-lifecycle cancellation and optional implementation-specific execution signals.

## Current official WebMCP specification check

Freshly reverified on 2026-09-06 against the official Web Machine Learning Community Group WebMCP Draft Community Group Report dated 2026-09-04.

Important correction found in this audit: the current draft defines `ToolExecuteCallback` as a callback receiving only the tool input object. The draft's `AbortSignal` is part of `ModelContextRegisterToolOptions` and unregisters the tool when aborted. The current draft does not define a standard second execution-options argument carrying an execution `AbortSignal`.

The existing CriShirt generation, refinement, and Virtual Try-On callbacks had been written as `(input, { signal })`. A standards-conforming host calling those callbacks with only `input` could therefore throw while destructuring the missing second argument before reaching application logic.

## Fresh full-journey audit — 2026-09-06 16:20 IST

### Repository / production isolation

Repository identity, write access, branch identity, production baseline, divergence, and the exact entering preview were verified before mutation. The working branch remains isolated from production and 0 commits behind `main`.

The branch diff remains scoped to WebMCP bridge/integration work, shared collection catalog extraction required for human/agent parity, README WebMCP documentation, and this durable progress log. No unrelated repository or production configuration was modified.

### Standards execution compatibility — fixed this audit

Source inspection of `WebMCPBridge.tsx` and `VRTryOn.tsx` revealed that three provider-backed tools depended on a non-standard required second execution argument: `crishirt_generate_design`, `crishirt_refine_design`, and `crishirt_run_virtual_tryon`.

A deliberately small compatibility layer was added at startup rather than rewriting provider/UI logic:

- `src/webmcp/executeCompat.ts` wraps CriShirt tool registration before React mounts.
- Standards-style `execute(input)` calls are normalized to the existing signal-aware handler shape.
- The registration lifecycle signal is supplied when no implementation-specific execution signal exists, so route/component teardown still aborts outstanding provider requests.
- If a browser implementation supplies a second execution object with a signal, that more specific signal is preserved.
- The adapter is feature-detected, idempotent, and a no-op when `document.modelContext` is unavailable.
- Existing Perfect Corp request bodies, result handling, UI state, cart state, routes, and human controls are unchanged.

README wording was updated to describe the current draft accurately instead of claiming a standardized per-execution `AbortSignal`.

### Create / edit

`crishirt_get_workspace_state` still collapses garment state, front/back design presence, placement, busy state, cart count, valid product options, route, and revision into one compact observation. `crishirt_configure_workspace` and `crishirt_set_design_placement` continue to replace multiple visual selectors and drag/resize/rotate interactions with bounded semantic actions.

No new compound create tool is justified. Bundling generation, placement, and cart mutation would save a small number of calls but worsen partial-failure recovery and obscure state transitions.

### Generation / refinement concurrency

The previously identified near-simultaneous generation/refinement overlap remains. Both tools still rely on React-propagated busy flags before a provider call, so two very close calls can theoretically pass the initial busy check before state propagation.

The smallest future fix remains a synchronous shared in-memory operation guard acquired before the provider call and released in `finally`. It was not mixed into this standards-compatibility fix because concurrency semantics should be reproduced and tested independently.

### Revision / cart race

Optimistic `expectedRevision` validation remains non-atomic for extremely close synchronous mutations because `revisionRef` advances when React state propagation is observed. Two rapid cart mutations can therefore validate the same revision before the first dispatch becomes visible.

Focused same-revision reservation or duplicate protection remains preferable to a global state rewrite and should be shipped only with a targeted behavior test.

### Cart and collection

Stable human cart capabilities remain covered semantically: inspect cart, add current configured apparel/design, add supported collection products, and remove existing items. No quantity-update or checkout tool is added because the stable human site does not expose a corresponding shared action.

`crishirt_list_collection` continues to expose stable IDs, category, price, availability, and image path without visual card inspection. `crishirt_add_collection_item_to_cart` reuses the same collection catalog/cart-item construction as the human Collection page.

### Navigation

Create, Virtual Try-On, Collection, and Cart remain directly reachable through one bounded navigation tool. Route-specific micro-tools would increase discovery burden without meaningful benefit.

### Virtual Try-On

The privacy boundary remains appropriate: readiness exposes semantic state and eligible cart item IDs only; raw person-photo data and generated result bytes are not exposed. Camera/file acquisition remains human-controlled.

Try-on still uses a synchronous `loadingRef` overlap guard and therefore does not share the immediate duplicate-execution race shape of generation/refinement.

### Schemas / payloads / annotations / recovery

The 13-tool surface remains coherent and high-leverage. Inputs are bounded to existing product capabilities; read tools remain compact; `readOnlyHint` and `untrustedContentHint` are used where appropriate; errors remain structured and deterministic.

No new tiny wrappers, payload expansion, or tool-count increase is justified in this audit.

## Tests and verification performed this audit

- Read `PROGRESS.md` before considering changes.
- Verified canonical repository `UnknownGod2011/crishirt-perfect-corp` and write access.
- Verified working branch `webmcp-agent-native` at exact entering head `df9a8555ffce5099bf353f3ae83fc8d3aee10cd4`.
- Verified production `main` remains `88daa417caa5305f81e5554977a13a94a793cdeb`.
- Compared branch against production: 46 commits ahead, 0 behind, merge base exactly the production baseline.
- Verified exact entering Vercel deployment `dpl_G1fV84xMDEnVJwoGTF1otpHJ3sz9` is `READY`.
- Verified its build executed `tsc -b && vite build` successfully and transformed 2020 modules.
- Reverified the official WebMCP draft and specifically its `ToolExecuteCallback` and `ModelContextRegisterToolOptions` IDL.
- Re-inspected the main WebMCP bridge, collection bridge, Virtual Try-On integration, README, and startup entry point.
- Reproduced the compatibility failure in a focused JavaScript harness: the old required second-argument destructuring throws `TypeError` when invoked with one argument.
- Verified the compatibility adapter with a focused harness: one-argument execution succeeds and the registration signal reaches the legacy handler.
- Verified the new compatibility helper and startup hook parse/transpile with TypeScript using `tsc --noCheck --jsx react-jsx --module esnext --target es2022 --skipLibCheck`; exit code 0.
- Retried a clean local clone; the runtime still fails before checkout with `Could not resolve host: github.com`.
- Full post-change production build and exact preview status must be verified on the commit produced by this audit before considering the source change fully validated.

## Failures found / fixes applied

- Fixed: provider-backed tool callbacks could fail under standards-style one-argument execution because they destructured a missing second argument.
- Fixed: README overstated a standardized per-execution WebMCP `AbortSignal`; wording now matches the current draft.
- Preserved: registration-lifecycle cancellation still reaches provider fetches, and implementation-specific execution signals remain compatible when present.
- Remaining: generation/refinement synchronous overlap candidate.
- Remaining: same-revision cart mutation window.
- Environment limitation: clean local checkout remains blocked by transient DNS resolution for `github.com`.
- Environment limitation: actual browser-side `document.modelContext.getTools()` / agent execution remains unavailable in this runtime.
- No production, deployment-config, unrelated repository, or UI change was made.

## Remaining opportunities

1. Verify the exact preview for this audit commit reaches `READY` and confirm `tsc -b && vite build` succeeds before treating the source change as validated.
2. Execute real `document.modelContext.getTools()` discovery and representative tool calls in a WebMCP-capable browser/testing surface when available.
3. Reproduce simultaneous generation/refinement, then add the smallest synchronous shared operation guard and verify duplicate rejection, failure cleanup, cancellation/lifecycle cleanup, and release.
4. Reproduce same-revision duplicate cart mutation, then add focused revision reservation/duplicate protection without rewriting global state.
5. Add lightweight tests for stale revisions, same-revision mutations, provider failure, unsupported-browser fallback, collection availability, route refresh, shared cart state, and Virtual Try-On errors when a safe harness is available.
6. Continue auditing schemas, descriptions, annotations, payload size, round trips, and recovery behavior without growing the tool surface unnecessarily.
7. Do not merge to `main` solely because a preview builds successfully.

## README

`README.md` remains concise and was corrected in this audit to describe the current WebMCP callback and cancellation semantics accurately. Detailed run history remains here in `PROGRESS.md`.

## Latest commit SHA

Latest audited working-branch commit entering this audit: `df9a8555ffce5099bf353f3ae83fc8d3aee10cd4`.

This file is updated before the audit commit is created, so the resulting commit SHA is intentionally recorded by the following run rather than attempting a self-referential hash.

## Next run

Read this file first. Reverify repository/branch/production isolation and the exact preview for the commit produced by this audit. If the preview is not `READY` or the full build fails, revert only this audit's compatibility/startup/docs change. If it is healthy, attempt real browser-side standards-style tool execution. Then independently target the generation/refinement overlap with a reproducible test before changing concurrency semantics.